import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGlobalSmsPremiumRate, getServicePriceConfigMap } from "@/lib/price-calculator";
import {
  computeSmsDisplayPriceNgn,
  fiveSimFetch,
  getFiveSimApiBase,
} from "@/lib/sms-provider";
import { normalizeServiceSearchQuery } from "@/lib/utils";

type FiveSimGuestProduct = {
  Category?: string;
  Qty?: number;
  Price?: number;
};

function matchesServiceQuery(key: string, query: string): boolean {
  const k = key.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return false;
  if (k.includes(q)) return true;
  const parts = q.split(/\s+/).filter(Boolean);
  return parts.every((p) => k.includes(p));
}

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

  if (!process.env.FIVE_SIM_API_KEY) {
    return NextResponse.json(
      { error: "FIVE_SIM_API_KEY not configured" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(req.url);
  let query = normalizeServiceSearchQuery(searchParams.get("service") ?? searchParams.get("q") ?? "");
  const country = (searchParams.get("country") ?? process.env.FIVE_SIM_GUEST_COUNTRY ?? "usa")
    .toLowerCase()
    .trim();
  const operator = (searchParams.get("operator") ?? process.env.FIVE_SIM_GUEST_OPERATOR ?? "any")
    .toLowerCase()
    .trim();
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "30", 10) || 30, 1), 50);

  if (query.length < 2) {
    return NextResponse.json({ services: [], query, total: 0 });
  }

  const base = getFiveSimApiBase();
  const url = `${base}/guest/products/${encodeURIComponent(country)}/${encodeURIComponent(operator)}`;

  try {
    const res = await fiveSimFetch(url);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[numbers/search] 5SIM guest products error:", err);
      return NextResponse.json(
        { error: typeof err === "object" && err && "message" in err ? String((err as { message: string }).message) : "Failed to fetch 5SIM products" },
        { status: res.status }
      );
    }

    const data = (await res.json()) as Record<string, FiveSimGuestProduct>;

    const services = Object.entries(data)
      .filter(([key]) => matchesServiceQuery(key, query))
      .map(([key, v]) => {
        const priceUsd = typeof v?.Price === "number" ? v.Price : Number(v?.Price) || 0;
        const qty = typeof v?.Qty === "number" ? v.Qty : Number(v?.Qty) || 0;
        const category = typeof v?.Category === "string" ? v.Category : "";
        return {
          key,
          name: formatServiceLabel(key),
          category,
          qty,
          priceUsd,
          basePriceNGN: computeSmsDisplayPriceNgn(priceUsd),
        };
      })
      .sort((a, b) => b.qty - a.qty)
      .slice(0, limit);

    const globalPremiumRate = await getGlobalSmsPremiumRate();

    const keys = services.map((s) => s.key);
    const configMap = await getServicePriceConfigMap(keys);

    const missing = services
      .filter((s) => !configMap.has(s.key))
      .map((s) => ({
        serviceKey: s.key,
        key: s.key,
        name: s.name,
        basePrice: s.basePriceNGN,
        premiumRate: globalPremiumRate,
      }));
    if (missing.length > 0) {
      await prisma.service.createMany({
        data: missing,
        skipDuplicates: true,
      });
      for (const m of missing) {
        configMap.set(m.serviceKey, {
          basePrice: m.basePrice,
          customPrice: null,
          effectiveBase: m.basePrice,
          premiumRate: m.premiumRate,
          name: m.name,
        });
      }
    }

    const pricedServices = services.map((s) => {
      const cfg = configMap.get(s.key);
      const effective = cfg?.effectiveBase ?? s.basePriceNGN;
      return {
        key: s.key,
        name: cfg?.name ?? s.name,
        category: s.category,
        qty: s.qty,
        priceUsd: s.priceUsd,
        priceNGN: Math.round(effective),
        premiumRate: cfg?.premiumRate ?? globalPremiumRate,
      };
    });

    return NextResponse.json({
      services: pricedServices,
      query,
      country,
      operator,
      total: pricedServices.length,
    });
  } catch (err) {
    console.error("[numbers/search] Network error:", err);
    return NextResponse.json({ error: "Network error contacting 5SIM" }, { status: 502 });
  }
}
