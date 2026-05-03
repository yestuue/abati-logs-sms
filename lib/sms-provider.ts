const DEFAULT_FIVE_SIM_BASE = "https://5sim.net/v1";

export function getFiveSimApiBase(): string {
  return (process.env.FIVE_SIM_API_BASE ?? DEFAULT_FIVE_SIM_BASE).replace(/\/$/, "");
}

/**
 * Headers for 5SIM API requests. Uses Bearer auth when FIVE_SIM_API_KEY is set.
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
  const extra = init?.headers;
  const merged: Record<string, string> = { ...headersToRecord(fiveSimHeaders()) };
  if (extra && typeof extra === "object" && !Array.isArray(extra)) {
    Object.assign(merged, headersToRecord(extra as HeadersInit));
  }
  return fetch(input, {
    ...init,
    headers: merged,
    cache: "no-store",
  });
}

function headersToRecord(h: HeadersInit): Record<string, string> {
  if (h instanceof Headers) {
    const o: Record<string, string> = {};
    h.forEach((v, k) => {
      o[k] = v;
    });
    return o;
  }
  if (Array.isArray(h)) {
    return Object.fromEntries(h);
  }
  return { ...(h as Record<string, string>) };
}

/**
 * Display price in NGN: (5sim_price_usd * SMS_EXCHANGE_RATE) + SMS_PROFIT_MARGIN
 */
export function computeSmsDisplayPriceNgn(priceUsd: number): number {
  const rate = Number(process.env.SMS_EXCHANGE_RATE ?? "1550");
  const margin = Number(process.env.SMS_PROFIT_MARGIN ?? "0");
  if (!Number.isFinite(priceUsd) || priceUsd < 0) return Math.max(0, margin);
  if (!Number.isFinite(rate) || rate < 0) {
    return Math.max(0, margin);
  }
  const raw = priceUsd * rate + (Number.isFinite(margin) ? margin : 0);
  return Math.ceil(raw);
}
export async function buyFiveSimNumber(country: string, operator: string, product: string): Promise<{ id: number; phone: string; operator: string; product: string; price: number; status: string; expires: string } | null> {
  const base = getFiveSimApiBase();
  const url = `${base}/user/buy/activation/${encodeURIComponent(country)}/${encodeURIComponent(operator)}/${encodeURIComponent(product)}`;
  const res = await fiveSimFetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[5sim buy error]", err);
    return null;
  }
  return res.json();
}
