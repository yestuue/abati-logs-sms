import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { seedServices } from "@/prisma/seed-admin-data";
import { isAdmin } from "@/lib/admin-access";

async function requireAdmin() {
  const session = await auth();
  if (!isAdmin(session)) {
    return null;
  }
  return session;
}

/** Upsert fallback catalog keys into Service. */
async function syncCatalogFromProvider() {
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

/**
 * GET /api/admin/pricing?syncCatalog=1 — list all SMS services (optionally refresh catalog first).
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
