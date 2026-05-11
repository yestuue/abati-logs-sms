import { SmsProvider, SmsActivationResponse, SmsOrderDetails, SmsOperatorPrice } from "./types";

const DEFAULT_FIVE_SIM_BASE = "https://5sim.net/v1";

function getFiveSimApiBase(): string {
  return (process.env.FIVE_SIM_API_BASE ?? DEFAULT_FIVE_SIM_BASE).replace(/\/$/, "");
}

function fiveSimHeaders(): HeadersInit {
  const key = process.env.FIVE_SIM_API_KEY;
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (key) {
    headers.Authorization = `Bearer ${key}`;
  }
  return headers;
}

async function fiveSimFetch(input: string | URL, init?: RequestInit): Promise<Response> {
  const headers = { ...fiveSimHeaders(), ...(init?.headers as Record<string, string>) };
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(input, {
      ...init,
      headers,
      cache: "no-store",
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const FiveSimProvider: SmsProvider = {
  name: "5sim",

  async buyNumber(country: string, operator: string, service: string): Promise<SmsActivationResponse> {
    const base = getFiveSimApiBase();
    const url = `${base}/user/buy/activation/${encodeURIComponent(country)}/${encodeURIComponent(operator)}/${encodeURIComponent(service)}`;
    const res = await fiveSimFetch(url);
    if (!res.ok) {
      const text = await res.text();
      if (res.status === 401) return { error: "Invalid 5Sim API Key." };
      if (res.status === 400) return { error: text || "Service out of stock." };
      return { error: `Provider error: ${text || res.statusText}` };
    }
    const data = await res.json();
    return { data };
  },

  async checkOrder(orderId: string): Promise<SmsOrderDetails | null> {
    const base = getFiveSimApiBase();
    const url = `${base}/user/check/activation/${orderId}`;
    const res = await fiveSimFetch(url);
    if (!res.ok) return null;
    return res.json();
  },

  async cancelOrder(orderId: string): Promise<boolean> {
    const base = getFiveSimApiBase();
    const url = `${base}/user/cancel/activation/${orderId}`;
    const res = await fiveSimFetch(url);
    return res.ok;
  },

  async banOrder(orderId: string): Promise<boolean> {
    const base = getFiveSimApiBase();
    const url = `${base}/user/ban/activation/${orderId}`;
    const res = await fiveSimFetch(url);
    return res.ok;
  },

  async getPrices(service: string, country: string): Promise<Record<string, SmsOperatorPrice>> {
    const base = getFiveSimApiBase();
    const url = `${base}/guest/prices?product=${encodeURIComponent(service)}&country=${encodeURIComponent(country)}`;
    const res = await fiveSimFetch(url);
    if (!res.ok) return {};
    const data = await res.json();
    return data?.[country]?.[service] || {};
  }
};
