import { getProvider } from "./sms-providers";

export function getFiveSimApiBase(): string {
  const base = process.env.FIVE_SIM_API_BASE ?? "https://5sim.net/v1";
  return base.replace(/\/$/, "");
}

/**
 * Headers for 5SIM API requests.
 */
export function fiveSimHeaders(): HeadersInit {
  const key = process.env.FIVE_SIM_API_KEY;
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (key) {
    headers.Authorization = `Bearer ${key}`;
  }
  return headers;
}

export async function fiveSimFetch(input: string | URL, init?: RequestInit): Promise<Response> {
  const key = process.env.FIVE_SIM_API_KEY;
  const merged: Record<string, string> = {
    Accept: "application/json",
    ...(key ? { Authorization: `Bearer ${key}` } : {}),
  };
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(input, {
      ...init,
      headers: { ...merged, ...(init?.headers as Record<string, string>) },
      cache: "no-store",
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

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

export async function buyFiveSimNumber(country: string, operator: string, product: string) {
  return getProvider("SERVER2").buyNumber(country, operator, product);
}

export async function checkOrder(server: string, orderId: string | number) {
  return getProvider(server).checkOrder(String(orderId));
}

export async function checkFiveSimOrder(orderId: string | number) {
  return getProvider("SERVER2").checkOrder(String(orderId));
}

export async function getFiveSimPrices(product: string, country: string) {
  return getProvider("SERVER2").getPrices(product, country);
}

export async function cancelFiveSimOrder(orderId: string | number) {
  return getProvider("SERVER2").cancelOrder(String(orderId));
}

export async function banFiveSimOrder(orderId: string | number) {
  return getProvider("SERVER2").banOrder(String(orderId));
}
