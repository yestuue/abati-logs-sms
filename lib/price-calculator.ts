import { prisma } from "@/lib/prisma";

export type SmsGlobalPremiumSettings = { server1: number; server2: number };

export async function getGlobalSmsPremiumSettings(): Promise<SmsGlobalPremiumSettings> {
  const settings = await prisma.globalSettings.findFirst({
    select: { smsGlobalPremiumRate: true, smsGlobalPremiumRateServer2: true },
  });
  return {
    server1: settings?.smsGlobalPremiumRate ?? 0.35,
    server2: settings?.smsGlobalPremiumRateServer2 ?? 0.35,
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
    select: { serviceKey: true, basePrice: true, customPrice: true, premiumRate: true, name: true },
  });
  return new Map(
    rows.map((r) => [
      r.serviceKey,
      {
        basePrice: r.basePrice,
        customPrice: r.customPrice,
        effectiveBase: effectiveServiceBase(r),
        premiumRate: r.premiumRate,
        name: r.name,
      },
    ])
  );
}
