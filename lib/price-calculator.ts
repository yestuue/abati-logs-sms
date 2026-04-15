import { prisma } from "@/lib/prisma";

export type SmsGlobalPremiumSettings = { server1: number; server2: number };
export type SmsGlobalMarginSettings = { server1MarginPct: number; server2MarginPct: number };

function sanitizeMarginPct(value: unknown, fallback = 35): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return n;
}

export async function getGlobalSmsMarginSettings(): Promise<SmsGlobalMarginSettings> {
  const settings = await prisma.globalSettings.findFirst({
    orderBy: { updatedAt: "desc" },
    select: {
      s1Margin: true,
      s2Margin: true,
      smsGlobalPremiumRate: true,
      smsGlobalPremiumRateServer2: true,
    },
  });
  // Backward-compatible fallback: derive margin % from legacy premium-rate decimals.
  const s1Pct = sanitizeMarginPct(
    settings?.s1Margin ?? (settings?.smsGlobalPremiumRate != null ? settings.smsGlobalPremiumRate * 100 : 35),
    35
  );
  const s2Pct = sanitizeMarginPct(
    settings?.s2Margin ??
      (settings?.smsGlobalPremiumRateServer2 != null
        ? settings.smsGlobalPremiumRateServer2 * 100
        : 35),
    35
  );
  return { server1MarginPct: s1Pct, server2MarginPct: s2Pct };
}

export async function getGlobalSmsPremiumSettings(): Promise<SmsGlobalPremiumSettings> {
  const margins = await getGlobalSmsMarginSettings();
  return {
    server1: margins.server1MarginPct / 100,
    server2: margins.server2MarginPct / 100,
  };
}

/** Server 1 (USA) global premium — used for catalog sync and legacy call sites. */
export async function getGlobalSmsPremiumRate(): Promise<number> {
  const s = await getGlobalSmsPremiumSettings();
  return s.server1;
}

export async function getGlobalSmsPremiumRateForServer(
  server: "SERVER1" | "SERVER2"
): Promise<number> {
  const s = await getGlobalSmsPremiumSettings();
  return server === "SERVER2" ? s.server2 : s.server1;
}

export type ServicePriceConfigRow = {
  basePrice: number;
  basePriceServer2: number | null;
  customPrice: number | null;
  effectiveBase: number;
  premiumRate: number;
  name: string;
};

export function effectiveServiceBase(row: { basePrice: number; customPrice: number | null }): number {
  return row.customPrice != null ? row.customPrice : row.basePrice;
}

export async function getServicePriceConfigMap(serviceKeys: string[]) {
  if (serviceKeys.length === 0) return new Map<string, ServicePriceConfigRow>();
  const rows = await prisma.service.findMany({
    where: { serviceKey: { in: serviceKeys } },
    select: {
      serviceKey: true,
      basePrice: true,
      basePriceServer2: true,
      customPrice: true,
      premiumRate: true,
      name: true,
    },
  });
  return new Map(
    rows.map((r) => [
      r.serviceKey,
      {
        basePrice: r.basePrice,
        basePriceServer2: r.basePriceServer2,
        customPrice: r.customPrice,
        effectiveBase: effectiveServiceBase(r),
        premiumRate: r.premiumRate,
        name: r.name,
      },
    ])
  );
}
