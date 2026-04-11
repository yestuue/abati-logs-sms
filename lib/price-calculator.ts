import { prisma } from "@/lib/prisma";

export async function getGlobalSmsPremiumRate(): Promise<number> {
  const settings = await prisma.globalSettings.findFirst({ select: { smsGlobalPremiumRate: true } });
  return settings?.smsGlobalPremiumRate ?? 0.35;
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
