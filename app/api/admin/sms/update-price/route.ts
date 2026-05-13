import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  upsertServer2MasterCountries,
} from "@/lib/server2-master-countries";
import { z } from "zod";
import { revalidatePath } from "next/cache";

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

import { isAdmin } from "@/lib/admin-access";

async function checkAdmin() {
  const session = await auth();
  return isAdmin(session);
}

export async function GET() {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [services, settings, servers, countries] = await Promise.all([
    prisma.service.findMany({ orderBy: { serviceKey: "asc" } }),
    prisma.globalSettings.findFirst({ orderBy: { updatedAt: "desc" } }),
    prisma.serverConfig.findMany({ orderBy: { server: "asc" } }),
    prisma.country.findMany({ orderBy: { name: "asc" } }),
  ]);

  const s1 = settings?.s1Margin ?? (settings?.smsGlobalPremiumRate ?? 0.35) * 100;
  const s2 = settings?.s2Margin ?? (settings?.smsGlobalPremiumRateServer2 ?? 0.35) * 100;
  return NextResponse.json({
    services,
    S1_MARGIN: s1,
    S2_MARGIN: s2,
    servers,
    countries,
  });
}

export async function PUT(req: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    const body = parsed.data;

    if (body.mode === "globalPremium") {
      const premiumRate = body.premiumRate ?? 0.35;
      const marginPct = premiumRate * 100;
      const target = body.premiumTarget ?? "SERVER1";
      const existing = await prisma.globalSettings.findFirst({
        orderBy: { updatedAt: "desc" },
        select: { id: true },
      });
      const data =
        target === "SERVER2"
          ? { s2Margin: marginPct, smsGlobalPremiumRateServer2: premiumRate }
          : { s1Margin: marginPct, smsGlobalPremiumRate: premiumRate };
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
      revalidatePath("/admin/pricing");
      revalidatePath("/dashboard/buy");
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

    if (body.mode !== "syncServer2Countries") {
      return NextResponse.json({ error: "Unsupported mode" }, { status: 400 });
    }

    // Master catalog: ensure AU/US/UK/CA + broad coverage.
    await upsertServer2MasterCountries(prisma);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/update-price] Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
