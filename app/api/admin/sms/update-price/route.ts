import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeSmsDisplayPriceNgn, fiveSimFetch, getFiveSimApiBase } from "@/lib/sms-provider";
import { z } from "zod";

const bodySchema = z.object({
  mode: z.enum(["globalPremium", "servicePrice", "toggleServer", "toggleCountry", "syncServer2Countries"]),
  serviceId: z.string().optional(),
  basePrice: z.number().positive().optional(),
  premiumRate: z.number().min(0).max(5).optional(),
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
    prisma.countryConfig.findMany({ orderBy: { name: "asc" } }),
  ]);

  return NextResponse.json({
    services,
    globalPremiumRate: settings?.smsGlobalPremiumRate ?? 0.35,
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
      const existing = await prisma.globalSettings.findFirst({ select: { id: true } });
      await prisma.$transaction([
        prisma.service.updateMany({ data: { premiumRate } }),
        existing
          ? prisma.globalSettings.update({
              where: { id: existing.id },
              data: { smsGlobalPremiumRate: premiumRate },
            })
          : prisma.globalSettings.create({ data: { smsGlobalPremiumRate: premiumRate } }),
      ]);
      return NextResponse.json({ success: true });
    }

    if (body.mode === "servicePrice") {
      if (!body.serviceId || typeof body.basePrice !== "number") {
        return NextResponse.json({ error: "serviceId and basePrice required" }, { status: 400 });
      }
      const updated = await prisma.service.update({
        where: { id: body.serviceId },
        data: {
          basePrice: body.basePrice,
          ...(typeof body.premiumRate === "number" ? { premiumRate: body.premiumRate } : {}),
        },
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
      const existing = await prisma.countryConfig.findUnique({ where: { slug: body.countrySlug } });
      if (!existing) return NextResponse.json({ error: "Country not found" }, { status: 404 });
      const updated = await prisma.countryConfig.update({
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

    for (const [slug, meta] of countries) {
      let samplePrice: number | null = null;
      try {
        const pRes = await fiveSimFetch(`${getFiveSimApiBase()}/guest/products/${encodeURIComponent(slug)}/any`);
        if (pRes.ok) {
          const products = (await pRes.json()) as Record<string, { Price?: number }>;
          const first = Object.values(products)[0];
          if (first?.Price) samplePrice = computeSmsDisplayPriceNgn(Number(first.Price) || 0);
        }
      } catch {
        // ignore per-country provider errors
      }

      await prisma.countryConfig.upsert({
        where: { slug },
        update: {
          name: meta?.text_en || slug,
          ...(samplePrice !== null ? { samplePrice } : {}),
        },
        create: {
          slug,
          name: meta?.text_en || slug,
          enabled: true,
          ...(samplePrice !== null ? { samplePrice } : {}),
        },
      });
    }

    return NextResponse.json({ success: true, synced: countries.length });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
