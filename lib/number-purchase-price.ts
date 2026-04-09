import type { ServerType } from "@prisma/client";

export const PURCHASE_CARRIER_VALUES = ["any", "att", "tmobile"] as const;
export type PurchaseCarrierPreference = (typeof PURCHASE_CARRIER_VALUES)[number];

/** US area codes: comma-separated 3-digit blocks, e.g. 212, 646, 917 */
export function parseUsAreaCodes(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim().replace(/\D/g, ""))
    .filter((d) => d.length === 3);
}

export function normalizePurchaseCarrier(raw: unknown): PurchaseCarrierPreference {
  if (raw === "att" || raw === "tmobile" || raw === "any") return raw;
  return "any";
}

export function purchasePremiumActive(params: {
  server: ServerType;
  carrier: string;
  areaCodesRaw: string;
}): boolean {
  if (params.server !== "SERVER1") return false;
  const hasArea = parseUsAreaCodes(params.areaCodesRaw).length > 0;
  const hasCarrier = params.carrier === "att" || params.carrier === "tmobile";
  return hasArea || hasCarrier;
}

export function purchasePremiumMultiplier(params: {
  server: ServerType;
  carrier: string;
  areaCodesRaw: string;
}): number {
  return purchasePremiumActive(params) ? 1.35 : 1;
}

export function finalNumberPurchasePriceNGN(
  baseNgN: number,
  params: { server: ServerType; carrier: string; areaCodesRaw: string }
): number {
  return Math.round(baseNgN * purchasePremiumMultiplier(params));
}
