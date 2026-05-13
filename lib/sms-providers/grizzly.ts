import { SmsProvider, SmsActivationResponse, SmsOrderDetails, SmsOperatorPrice } from "./types";
import { prisma } from "../prisma";

async function getGrizzlyConfig() {
  const settings = await prisma.globalSettings.findFirst({
    orderBy: { updatedAt: "desc" },
    select: { grizzlyApiKey: true },
  });
  const apiKey = settings?.grizzlyApiKey || process.env.GRIZZLY_API_KEY;
  return { apiKey };
}

const GRIZZLY_BASE = "https://api.grizzlysms.com/stubs/handler_api.php";

export const GrizzlyProvider: SmsProvider = {
  name: "grizzly",

  async buyNumber(country: string, operator: string, service: string): Promise<SmsActivationResponse> {
    const { apiKey } = await getGrizzlyConfig();
    if (!apiKey) return { error: "Grizzly API Key not configured." };

    try {
      // Map country names/slugs to Grizzly IDs if necessary, but usually slugs work or IDs are needed.
      // For now we assume country is the ID or slug handled by the UI.
      const url = `${GRIZZLY_BASE}?api_key=${apiKey}&action=getNumber&service=${service}&country=${country}&operator=${operator}`;
      const res = await fetch(url);
      const text = await res.text();

      if (text.startsWith("ACCESS_NUMBER")) {
        const [, id, phone] = text.split(":");
        return {
          data: {
            id,
            phone,
            operator,
            product: service,
            price: 0, // Grizzly doesn't return price in getNumber, usually handled via getPrices
            status: "RECEIVED",
            expires: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
          },
        };
      }

      return { error: `Grizzly error: ${text}` };
    } catch (err: any) {
      return { error: `Grizzly request failed: ${err.message}` };
    }
  },

  async checkOrder(orderId: string): Promise<SmsOrderDetails | null> {
    const { apiKey } = await getGrizzlyConfig();
    if (!apiKey) return null;

    try {
      const url = `${GRIZZLY_BASE}?api_key=${apiKey}&action=getStatus&id=${orderId}`;
      const res = await fetch(url);
      const text = await res.text();

      // STATUS_WAIT_CODE, STATUS_WAIT_RESEND, STATUS_CANCEL, STATUS_OK:code
      if (text.startsWith("STATUS_OK")) {
        const [, code] = text.split(":");
        return {
          id: orderId,
          phone: "", // Grizzly doesn't return phone here
          operator: "",
          product: "",
          price: 0,
          status: "FINISHED",
          expires: "",
          sms: [{ date: new Date().toISOString(), from: "", text: code, code }],
        };
      }

      return {
        id: orderId,
        phone: "",
        operator: "",
        product: "",
        price: 0,
        status: text === "STATUS_WAIT_CODE" ? "RECEIVED" : "CANCELLED",
        expires: "",
        sms: null,
      };
    } catch {
      return null;
    }
  },

  async cancelOrder(orderId: string): Promise<boolean> {
    const { apiKey } = await getGrizzlyConfig();
    if (!apiKey) return false;

    try {
      const url = `${GRIZZLY_BASE}?api_key=${apiKey}&action=setStatus&status=8&id=${orderId}`;
      const res = await fetch(url);
      const text = await res.text();
      return text === "ACCESS_CANCEL";
    } catch {
      return false;
    }
  },

  async banOrder(orderId: string): Promise<boolean> {
    // In SMS-Activate protocol, status=8 is cancel/finish without SMS.
    return this.cancelOrder(orderId);
  },

  async getPrices(service: string, country: string): Promise<Record<string, SmsOperatorPrice>> {
    const { apiKey } = await getGrizzlyConfig();
    if (!apiKey) return {};

    try {
      const url = `${GRIZZLY_BASE}?api_key=${apiKey}&action=getPrices&service=${service}&country=${country}`;
      const res = await fetch(url);
      const data = await res.json();

      // Grizzly returns { "countryId": { "service": { "operator": cost } } }
      const countryData = data[country];
      if (!countryData || !countryData[service]) return {};

      const operators = countryData[service];
      const result: Record<string, SmsOperatorPrice> = {};

      for (const [op, cost] of Object.entries(operators)) {
        result[op] = {
          cost: Number(cost),
          count: 999,
          rate: Number(cost),
        };
      }

      return result;
    } catch {
      return {};
    }
  },
};
