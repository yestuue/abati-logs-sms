import { getProvider } from "./sms-providers";

/**
 * Converts USD price to NGN based on exchange rate.
 * @param priceUsd Price in USD from provider
 * @param rate Optional exchange rate override (defaults to env or 1550)
 * @returns Rounded NGN price
 */
export function computeSmsDisplayPriceNgn(priceUsd: number, rate?: number): number {
  const exchangeRate = rate ?? Number(process.env.SMS_EXCHANGE_RATE ?? "1550");
  if (!Number.isFinite(priceUsd) || priceUsd < 0) return 0;
  return Math.ceil(priceUsd * exchangeRate);
}

export async function buyNumber(server: string, country: string, operator: string, product: string) {
  return getProvider(server).buyNumber(country, operator, product);
}

export async function checkOrder(server: string, orderId: string | number) {
  return getProvider(server).checkOrder(String(orderId));
}

export async function cancelOrder(server: string, orderId: string | number) {
  return getProvider(server).cancelOrder(String(orderId));
}

export async function banOrder(server: string, orderId: string | number) {
  return getProvider(server).banOrder(String(orderId));
}

export async function getPrices(server: string, product: string, country: string) {
  return getProvider(server).getPrices(product, country);
}
