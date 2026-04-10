import { prisma } from "@/lib/prisma";

export async function getGlobalSmsPremiumRate(): Promise<number> {
  const settings = await prisma.globalSettings.findFirst({ select: { smsGlobalPremiumRate: true } });
  return settings?.smsGlobalPremiumRate ?? 0.35;
}

export async function getServicePriceConfigMap(serviceKeys: string[]) {
  if (serviceKeys.length === 0) return new Map<string, { basePrice: number; premiumRate: number; name: string }>();
  const rows = await prisma.service.findMany({
    where: { serviceKey: { in: serviceKeys } },
    select: { serviceKey: true, basePrice: true, premiumRate: true, name: true },
  });
  return new Map(rows.map((r) => [r.serviceKey, { basePrice: r.basePrice, premiumRate: r.premiumRate, name: r.name }]));
}
