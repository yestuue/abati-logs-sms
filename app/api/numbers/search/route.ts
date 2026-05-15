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
    // 1. Search our database for services matching the query
    const matchingServices = await prisma.service.findMany({
      where: {
        OR: [
          { name: { startsWith: query, mode: 'insensitive' } },
          { serviceKey: { startsWith: query, mode: 'insensitive' } }
        ]
      },
      take: 20
    });

    // 2. Fetch prices from provider (Twilio returns a fixed price)
    const ops = await provider.getPrices(query, providerCountry);
    const twilioPrice = ops["Twilio"]?.cost ?? 0.5;

    // 3. Map database services to the result format
    let services = matchingServices.map(s => ({
      key: s.serviceKey,
      name: s.name,
      qty: 999, // Twilio usually has plenty of stock
      priceUsd: twilioPrice,
      category: "",
      basePriceNGN: computeSmsDisplayPriceNgn(twilioPrice, exchangeRate),
    }));

    // 4. If no services found in DB, fallback to the user's raw query
    if (services.length === 0) {
      services = [{
        key: query,
        name: `${formatServiceLabel(query)} (Twilio)`,
        qty: 999,
        priceUsd: twilioPrice,
        category: "",
        basePriceNGN: computeSmsDisplayPriceNgn(twilioPrice, exchangeRate),
      }];
    }

    if (services.length === 0) {
      return NextResponse.json({ services: [], query, total: 0 });
    }

    const globalPremiumRate = await getGlobalSmsPremiumRateForServer(serverForPremium);
    const fixedProfitNGN = settings?.fixedProfitNGN ?? 0;
    const keys = services.map((s) => s.key);
    const configMap = await getServicePriceConfigMap(keys);

    const pricedServices = services.map((s) => {
      const cfg = configMap.get(s.key);
      
      // The "base" price to use: 
      // 1. Specific server price from DB
      // 2. Global base price from DB
      // 3. Fallback to current provider cost
      const sourcePrice = serverForPremium === "SERVER2"
        ? (cfg?.basePriceServer2 ?? cfg?.effectiveBase ?? s.basePriceNGN)
        : (cfg?.effectiveBase ?? s.basePriceNGN);
      
      // IMPORTANT: Apply the global profit margin and fixed profit on top of the base price
      // to ensure the admin's profit settings are reflected.
      const finalPrice = Math.ceil(sourcePrice * (1 + globalPremiumRate) + fixedProfitNGN);
          
      return {
        key: s.key,
        name: cfg?.name ?? s.name,
        category: s.category,
        qty: s.qty,
        priceUsd: s.priceUsd,
        priceNGN: finalPrice,
        premiumRate: globalPremiumRate,
      };
    });

    // Consolidate services by key to ensure stability in the UI
    const consolidatedMap = new Map<string, typeof pricedServices[0]>();
    for (const s of pricedServices) {
      if (!consolidatedMap.has(s.key)) {
        consolidatedMap.set(s.key, s);
      } else {
        // If we have multiple, keep the one with higher stock or just the first one found
        const existing = consolidatedMap.get(s.key)!;
        if (s.qty > existing.qty) {
          consolidatedMap.set(s.key, s);
        }
      }
    }

    const finalServices = Array.from(consolidatedMap.values());

    return NextResponse.json({
      services: finalServices,
      query,
      country,
      total: finalServices.length,
    }, {
      headers: { "Cache-Control": "no-store" }
    });
  } catch (err) {
    console.error("[numbers/search] Error:", err);
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
  }
}
