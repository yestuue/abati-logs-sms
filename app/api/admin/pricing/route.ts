import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeSmsDisplayPriceNgn, fiveSimFetch, getFiveSimApiBase } from "@/lib/sms-provider";
import { getGlobalSmsPremiumRate } from "@/lib/price-calculator";
import { seedServices } from "@/prisma/seed-admin-data";

import { isAdmin } from "@/lib/admin-access";

async function requireAdmin() {
  const session = await auth();
  if (!isAdmin(session)) {
    return null;
  }
  return session;
}

/** Upsert all guest product keys from 5SIM into Service (does not clear customPrice). */
async function syncCatalogFromProvider() {
  // When provider key is missing, seed a practical fallback catalog so admin can still manage pricing.
  if (!process.env.FIVE_SIM_API_KEY) {
    await prisma.$transaction(
      seedServices.map((s) =>
        prisma.service.upsert({
          where: { serviceKey: s.serviceKey },
          update: { name: s.name },
          create: {
            key: s.key,
            serviceKey: s.serviceKey,
            name: s.name,
            basePrice: s.basePrice,
            basePriceServer2: s.basePrice,
            premiumRate: 0.35,
          },
        })
      )
    );
    return seedServices.length;
  }

  const url = `${getFiveSimApiBase()}/guest/products/usa/any`;
  const res = await fiveSimFetch(url);
  if (!res.ok) return 0;

  const data = (await res.json()) as Record<string, { Price?: number }>;
  const globalPremium = await getGlobalSmsPremiumRate();
  const entries = Object.entries(data);
  let n = 0;

  for (const [key, v] of entries) {
    const usd = typeof v?.Price === "number" ? v.Price : Number(v?.Price) || 0;
    const basePrice = computeSmsDisplayPriceNgn(usd);
    const existing = await prisma.service.findUnique({
      where: { serviceKey: key },
      select: { id: true, customPrice: true, basePriceServer2: true },
    });
    if (!existing) {
      await prisma.service.create({
        data: {
          key,
          serviceKey: key,
          name: key,
          basePrice,
          basePriceServer2: basePrice,
          premiumRate: globalPremium,
        },
      });
      n++;
    } else if (existing.customPrice == null) {
      await prisma.service.update({
        where: { id: existing.id },
        data: {
          basePrice,
          ...(existing.basePriceServer2 == null ? { basePriceServer2: basePrice } : {}),
        },
      });
      n++;
    }
  }
  return entries.length;
}

/**
 * GET /api/admin/pricing?syncCatalog=1 — list all SMS services (optionally refresh catalog from provider first).
 */
export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  if (searchParams.get("syncCatalog") === "1") {
    try {
      const synced = await syncCatalogFromProvider();
      return NextResponse.json({
        syncedKeys: synced,
        services: await prisma.service.findMany({ orderBy: { name: "asc" } }),
      });
    } catch (e) {
      console.error("[admin/pricing sync]", e);
      return NextResponse.json({ error: "Catalog sync failed" }, { status: 502 });
    }
  }

  const [services, settings] = await Promise.all([
    prisma.service.findMany({ orderBy: { name: "asc" } }),
    prisma.globalSettings.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { smsGlobalPremiumRate: true, smsGlobalPremiumRateServer2: true },
    }),
  ]);
  const s1 = settings?.smsGlobalPremiumRate ?? 0.35;
  const s2 = settings?.smsGlobalPremiumRateServer2 ?? 0.35;
  return NextResponse.json({
    services,
    globalPremiumRate: s1,
    globalPremiumRateServer1: s1,
    globalPremiumRateServer2: s2,
  });
}
