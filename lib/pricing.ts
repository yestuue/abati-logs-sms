import { prisma } from "@/lib/prisma";

/**
 * Calculates the final selling price for a service.
 *
 * Resolution order:
 *  1. Look for a PriceConfig row matching `serviceName` exactly.
 *  2. Fall back to the "Global" catch-all row.
 *  3. If neither exists, return `basePrice` unchanged.
 *
 * Markup order: fixed first, then percentage on top.
 */
export async function calculatePrice(
  basePrice: number,
  serviceName: string
): Promise<number> {
  // Try service-specific config, then Global fallback in one round-trip
  const [specific, global] = await Promise.all([
    prisma.priceConfig.findUnique({ where: { serviceName } }),
    prisma.priceConfig.findUnique({ where: { serviceName: "Global" } }),
  ]);

  const config = specific ?? global;
  // No config at all — apply a 30% default markup
  if (!config) return Math.ceil(basePrice * 1.3);

  const afterFixed = basePrice + config.fixedMarkup;
  const afterPercent = afterFixed * (1 + config.percentMarkup / 100);

  // Round up to the nearest whole unit
  return Math.ceil(afterPercent);
}

/**
 * Pure (no DB) version for when you already have the config values.
 * Useful in client components or loops where you've pre-fetched configs.
 */
export function applyMarkup(
  basePrice: number,
  fixedMarkup: number,
  percentMarkup: number
): number {
  const afterFixed = basePrice + fixedMarkup;
  const afterPercent = afterFixed * (1 + percentMarkup / 100);
  return Math.ceil(afterPercent);
}
