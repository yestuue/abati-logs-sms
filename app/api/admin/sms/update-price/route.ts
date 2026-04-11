import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeSmsDisplayPriceNgn, fiveSimFetch, getFiveSimApiBase } from "@/lib/sms-provider";
import { z } from "zod";

const bodySchema = z.object({
  mode: z.enum(["globalPremium", "servicePrice", "toggleServer", "toggleCountry", "syncServer2Countries"]),
  serviceId: z.string().optional(),
  basePrice: z.number().positive().optional(),
  /** When set (including null), updates the per-service price override; null clears override. */
  customPrice: z.union([z.number().positive(), z.null()]).optional(),
  premiumRate: z.number().min(0).max(5).optional(),
  /** With mode globalPremium: which global setting to update (default SERVER1). */
  premiumTarget: z.enum(["SERVER1", "SERVER2"]).optional(),
  server: z.enum(["SERVER1", "SERVER2"]).optional(),
  isEnabled: z.boolean().optional(),
  countrySlug: z.string().optional(),
});

async function isAdmin() {
  const session = await auth();
  return !!session && session.user.role === "ADMIN";
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [services, settings, servers, countries] = await Promise.all([
    prisma.service.findMany({ orderBy: { serviceKey: "asc" } }),
    prisma.globalSettings.findFirst(),
    prisma.serverConfig.findMany({ orderBy: { server: "asc" } }),
    prisma.country.findMany({ orderBy: { name: "asc" } }),
  ]);

  const s1 = settings?.smsGlobalPremiumRate ?? 0.35;
  const s2 = settings?.smsGlobalPremiumRateServer2 ?? 0.35;
  return NextResponse.json({
    services,
    globalPremiumRate: s1,
    globalPremiumRateServer1: s1,
    globalPremiumRateServer2: s2,
    servers,
    countries,
  });
}

export async function PUT(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    const body = parsed.data;

    if (body.mode === "globalPremium") {
      const premiumRate = body.premiumRate ?? 0.35;
      const target = body.premiumTarget ?? "SERVER1";
      const existing = await prisma.globalSettings.findFirst({ select: { id: true } });
      const data =
        target === "SERVER2"
          ? { smsGlobalPremiumRateServer2: premiumRate }
          : { smsGlobalPremiumRate: premiumRate };
      if (existing) {
        await prisma.globalSettings.update({ where: { id: existing.id }, data });
      } else {
        await prisma.globalSettings.create({
          data:
            target === "SERVER2"
              ? { smsGlobalPremiumRateServer2: premiumRate }
              : { smsGlobalPremiumRate: premiumRate },
        });
      }
      return NextResponse.json({ success: true });
    }

    if (body.mode === "servicePrice") {
      if (!body.serviceId) {
        return NextResponse.json({ error: "serviceId required" }, { status: 400 });
      }
      const hasCustom = body.customPrice !== undefined;
      const hasBase = typeof body.basePrice === "number";
      const hasPremium = typeof body.premiumRate === "number";
      if (!hasCustom && !hasBase && !hasPremium) {
        return NextResponse.json(
          { error: "Provide customPrice, basePrice, and/or premiumRate" },
          { status: 400 }
        );
      }
      const data: { basePrice?: number; customPrice?: number | null; premiumRate?: number } = {};
      if (hasCustom) data.customPrice = body.customPrice;
      if (hasBase) data.basePrice = body.basePrice;
      if (hasPremium) data.premiumRate = body.premiumRate;
      const updated = await prisma.service.update({
        where: { id: body.serviceId },
        data,
      });
      return NextResponse.json({ service: updated });
    }

    if (body.mode === "toggleServer") {
      if (!body.server || typeof body.isEnabled !== "boolean") {
        return NextResponse.json({ error: "server and isEnabled required" }, { status: 400 });
      }
      const cfg = await prisma.serverConfig.upsert({
        where: { server: body.server },
        update: { isEnabled: body.isEnabled },
        create: {
          server: body.server,
          name: body.server === "SERVER1" ? "Server 1 — USA Numbers" : "Server 2 — Global Numbers",
          isEnabled: body.isEnabled,
        },
      });
      return NextResponse.json({ config: cfg });
    }

    if (body.mode === "toggleCountry") {
      if (!body.countrySlug || typeof body.isEnabled !== "boolean") {
        return NextResponse.json({ error: "countrySlug and isEnabled required" }, { status: 400 });
      }
      const existing = await prisma.country.findUnique({ where: { slug: body.countrySlug } });
      if (!existing) return NextResponse.json({ error: "Country not found" }, { status: 404 });
      const updated = await prisma.country.update({
        where: { slug: body.countrySlug },
        data: { enabled: body.isEnabled },
      });
      return NextResponse.json({ country: updated });
    }

    const url = `${getFiveSimApiBase()}/guest/countries`;
    const res = await fiveSimFetch(url);
    if (!res.ok) return NextResponse.json({ error: "Provider country sync failed" }, { status: res.status });
    const data = (await res.json()) as Record<string, { text_en?: string }>;
    const countries = Object.entries(data);

    // Fast sync: persist provider-supported countries immediately.
    await prisma.$transaction(
      countries.map(([slug, meta]) =>
        prisma.country.upsert({
          where: { slug },
          update: { name: meta?.text_en || slug },
          create: {
            slug,
            name: meta?.text_en || slug,
            enabled: true,
          },
        })
      )
    );

    // Optional sample prices for first 20 countries only (avoid long admin request times).
    const top = countries.slice(0, 20);
    for (const [slug] of top) {
      try {
        const pRes = await fiveSimFetch(`${getFiveSimApiBase()}/guest/products/${encodeURIComponent(slug)}/any`);
        if (!pRes.ok) continue;
        const products = (await pRes.json()) as Record<string, { Price?: number }>;
        const first = Object.values(products)[0];
        if (!first?.Price) continue;
        await prisma.country.update({
          where: { slug },
          data: { basePrice: computeSmsDisplayPriceNgn(Number(first.Price) || 0) },
        });
      } catch {
        // ignore sample price enrichment failures
      }
    }

    return NextResponse.json({ success: true, synced: countries.length });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
