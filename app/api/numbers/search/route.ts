import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGlobalSmsPremiumRateForServer, getServicePriceConfigMap } from "@/lib/price-calculator";
import { computeSmsDisplayPriceNgn } from "@/lib/sms-provider";
import { normalizeServiceSearchQuery } from "@/lib/utils";
import { getActiveProvider } from "@/lib/sms-providers";

function formatServiceLabel(key: string): string {
  const lower = key.toLowerCase();
  const map: Record<string, string> = {
    whatsapp: "WhatsApp",
    telegram: "Telegram",
    instagram: "Instagram",
    facebook: "Facebook",
    tiktok: "TikTok",
    google: "Google",
    gmail: "Gmail",
  };
  if (map[lower]) return map[lower];
  return key
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = normalizeServiceSearchQuery(searchParams.get("service") ?? searchParams.get("q") ?? "");
  let country = (searchParams.get("country") ?? "usa").toLowerCase().trim();
  const serverRaw = (searchParams.get("server") ?? "SERVER1").toUpperCase();
  const serverForPremium = serverRaw === "SERVER2" ? "SERVER2" : "SERVER1";

  if (query.length < 2) {
    return NextResponse.json({ services: [], query, total: 0 });
  }

  const settings = await prisma.globalSettings.findFirst({
    orderBy: { updatedAt: "desc" },
  });
  const exchangeRate = settings?.smsExchangeRate ?? settings?.rateNGN ?? Number(process.env.SMS_EXCHANGE_RATE ?? "1550");

  const provider = await getActiveProvider(serverForPremium);

  let providerCountry = country; // Default to slug (e.g. "nigeria")
  
  // Twilio requires 2-letter ISO codes (e.g. "NG", "US"). 
  // We fetch this from our country catalog.
  const countryRecord = await prisma.country.findFirst({
    where: { slug: country },
  });
  if (countryRecord?.iso2) {
    providerCountry = countryRecord.iso2;
  }

  try {
    const ops = await provider.getPrices(query, providerCountry);
    
    const services = Object.entries(ops).map(([opName, op]) => ({
      key: query,
      name: `${formatServiceLabel(query)} (${opName})`,
      qty: op.count,
      priceUsd: op.cost,
      category: "",
      basePriceNGN: computeSmsDisplayPriceNgn(op.cost, exchangeRate),
    }));

    if (services.length === 0) {
      return NextResponse.json({ services: [], query, total: 0 });
    }

    const globalPremiumRate = await getGlobalSmsPremiumRateForServer(serverForPremium);
    const keys = services.map((s) => s.key);
    const configMap = await getServicePriceConfigMap(keys);

    const pricedServices = services.map((s) => {
      const cfg = configMap.get(s.key);
      const effective =
        serverForPremium === "SERVER2"
          ? (cfg?.basePriceServer2 ?? cfg?.effectiveBase ?? s.basePriceNGN)
          : (cfg?.effectiveBase ?? s.basePriceNGN);
          
      return {
        key: s.key,
        name: cfg?.name ?? s.name,
        category: s.category,
        qty: s.qty,
        priceUsd: s.priceUsd,
        priceNGN: Math.round(effective),
        premiumRate: globalPremiumRate,
      };
    });

    return NextResponse.json({
      services: pricedServices,
      query,
      country,
      total: pricedServices.length,
    }, {
      headers: { "Cache-Control": "no-store" }
    });
  } catch (err) {
    console.error("[numbers/search] Error:", err);
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
  }
}
