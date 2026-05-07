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
  if (params.server === "SERVER2") return true;
  if (params.server === "SERVER1") {
    const hasCarrier = params.carrier !== "any";
    const hasAreaCodes = params.areaCodesRaw.trim().length > 0;
    return hasCarrier || hasAreaCodes;
  }
  return false;
}

export function purchasePremiumMultiplier(params: {
  server: ServerType;
  carrier: string;
  areaCodesRaw: string;
  premiumRate?: number;
}): number {
  const rate = typeof params.premiumRate === "number" ? params.premiumRate : 0.20;
  return purchasePremiumActive(params) ? 1 + rate : 1;
}

export function finalNumberPurchasePriceNGN(
  baseNgN: number,
  params: { server: ServerType; carrier: string; areaCodesRaw: string; premiumRate?: number }
): number {
  return Math.ceil(baseNgN * purchasePremiumMultiplier(params));
}
