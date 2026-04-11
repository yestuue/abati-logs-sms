import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeSmsDisplayPriceNgn, fiveSimFetch, getFiveSimApiBase } from "@/lib/sms-provider";
import { z } from "zod";

type FiveSimGuestProduct = {
  Price?: number;
};

const globalSchema = z.object({
  premiumRate: z.number().min(0).max(5),
  premiumTarget: z.enum(["SERVER1", "SERVER2"]).default("SERVER1"),
});

async function ensureServiceSeed(globalPremiumRate: number) {
  const existingCount = await prisma.service.count();
  if (existingCount > 0) return;

  const fallback = [
    "facebook",
    "google",
    "whatsapp",
    "telegram",
    "instagram",
    "tiktok",
  ];
  const base = getFiveSimApiBase();
  const url = `${base}/guest/products/usa/any`;

  try {
    const res = await fiveSimFetch(url);
    if (!res.ok) throw new Error("seed fetch failed");
    const data = (await res.json()) as Record<string, FiveSimGuestProduct>;
    const rows = Object.entries(data).slice(0, 500).map(([serviceKey, v]) => {
      const usd = typeof v?.Price === "number" ? v.Price : Number(v?.Price) || 0;
      return {
        serviceKey,
        key: serviceKey,
        name: serviceKey,
        basePrice: computeSmsDisplayPriceNgn(usd),
        premiumRate: globalPremiumRate,
      };
    });
    if (rows.length > 0) {
      await prisma.service.createMany({ data: rows, skipDuplicates: true });
      return;
    }
  } catch {
    // fallback below
  }

  await prisma.service.createMany({
    data: fallback.map((serviceKey) => ({
      key: serviceKey,
      serviceKey,
      name: serviceKey,
      basePrice: 2500,
      premiumRate: globalPremiumRate,
    })),
    skipDuplicates: true,
  });
}

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await prisma.globalSettings.findFirst();
  const globalPremiumRate = settings?.smsGlobalPremiumRate ?? 0.35;
  const globalPremiumRateServer2 = settings?.smsGlobalPremiumRateServer2 ?? 0.35;
  await ensureServiceSeed(globalPremiumRate);

  const services = await prisma.service.findMany({
    orderBy: { serviceKey: "asc" },
  });
  return NextResponse.json({
    services,
    globalPremiumRate,
    globalPremiumRateServer1: globalPremiumRate,
    globalPremiumRateServer2,
  });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = globalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid premium rate" }, { status: 400 });
    }

    const { premiumRate, premiumTarget } = parsed.data;
    const existing = await prisma.globalSettings.findFirst({ select: { id: true } });
    const data =
      premiumTarget === "SERVER2"
        ? { smsGlobalPremiumRateServer2: premiumRate }
        : { smsGlobalPremiumRate: premiumRate };
    if (existing) {
      await prisma.globalSettings.update({ where: { id: existing.id }, data });
    } else {
      await prisma.globalSettings.create({
        data:
          premiumTarget === "SERVER2"
            ? { smsGlobalPremiumRateServer2: premiumRate }
            : { smsGlobalPremiumRate: premiumRate },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
