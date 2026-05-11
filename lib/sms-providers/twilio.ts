import { SmsProvider, SmsActivationResponse, SmsOrderDetails, SmsOperatorPrice } from "./types";

const TWILIO_BASE = "https://api.twilio.com/2010-04-01";

function getTwilioAuth(): string {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return "";
  return Buffer.from(`${sid}:${token}`).toString("base64");
}

export const TwilioProvider: SmsProvider = {
  name: "twilio",

  async buyNumber(country: string, operator: string, service: string): Promise<SmsActivationResponse> {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const auth = getTwilioAuth();
    
    if (!sid || !auth) {
      return { error: "Twilio credentials not configured in environment variables." };
    }

    try {
      // 1. Search for an available number
      const countryCode = country.toUpperCase() || "US";
      const searchUrl = `${TWILIO_BASE}/Accounts/${sid}/AvailablePhoneNumbers/${countryCode}/Local.json?SmsEnabled=true&PageSize=1`;
      
      const searchRes = await fetch(searchUrl, {
        headers: { Authorization: `Basic ${auth}` }
      });

      if (!searchRes.ok) {
        const err = await searchRes.json().catch(() => ({}));
        return { error: `Twilio search failed: ${err.message || searchRes.statusText}` };
      }

      const searchData = await searchRes.json();
      const available = searchData.available_phone_numbers;
      
      if (!available || available.length === 0) {
        return { error: `No available SMS-enabled numbers found in ${countryCode}.` };
      }

      const phoneNumber = available[0].phone_number;

      // 2. Purchase the number
      const buyUrl = `${TWILIO_BASE}/Accounts/${sid}/IncomingPhoneNumbers.json`;
      const buyRes = await fetch(buyUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          PhoneNumber: phoneNumber,
        })
      });

      if (!buyRes.ok) {
        const err = await buyRes.json().catch(() => ({}));
        return { error: `Twilio purchase failed: ${err.message || buyRes.statusText}` };
      }

      const buyData = await buyRes.json();

      return {
        data: {
          id: buyData.sid, // PN...
          phone: buyData.phone_number,
          operator: "Twilio",
          product: service,
          price: 1.15, // Default USA cost
          status: "RECEIVED",
          expires: new Date(Date.now() + 20 * 60 * 1000).toISOString()
        }
      };
    } catch (err: any) {
      console.error("[Twilio Provider] Error:", err);
      return { error: `Twilio Error: ${err.message || "Unknown error"}` };
    }
  },

  async checkOrder(orderId: string): Promise<SmsOrderDetails | null> {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const auth = getTwilioAuth();
    if (!sid || !auth) return null;

    try {
      // Fetch number info first to get the phone number
      const numUrl = `${TWILIO_BASE}/Accounts/${sid}/IncomingPhoneNumbers/${orderId}.json`;
      const numRes = await fetch(numUrl, { headers: { Authorization: `Basic ${auth}` } });
      if (!numRes.ok) return null;
      const numData = await numRes.json();
      const phoneNumber = numData.phone_number;

      // Fetch messages
      const msgUrl = `${TWILIO_BASE}/Accounts/${sid}/Messages.json?To=${encodeURIComponent(phoneNumber)}&PageSize=10`;
      const msgRes = await fetch(msgUrl, { headers: { Authorization: `Basic ${auth}` } });
      if (!msgRes.ok) return null;
      const msgData = await msgRes.json();

      const sms = msgData.messages.map((m: any) => ({
        date: m.date_sent,
        from: m.from,
        text: m.body,
        code: m.body.match(/\d{4,8}/)?.[0] || ""
      }));

      return {
        id: orderId,
        phone: phoneNumber,
        operator: "Twilio",
        product: "any",
        price: 1.15,
        status: "RECEIVED",
        expires: "",
        sms: sms.length > 0 ? sms : null
      };
    } catch (err) {
      console.error("[Twilio checkOrder] Error:", err);
      return null;
    }
  },

  async cancelOrder(orderId: string): Promise<boolean> {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const auth = getTwilioAuth();
    if (!sid || !auth) return false;

    try {
      const url = `${TWILIO_BASE}/Accounts/${sid}/IncomingPhoneNumbers/${orderId}.json`;
      const res = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: `Basic ${auth}` }
      });
      return res.status === 204;
    } catch (err) {
      return false;
    }
  },

  async banOrder(orderId: string): Promise<boolean> {
    return this.cancelOrder(orderId);
  },

  async getPrices(service: string, country: string): Promise<Record<string, SmsOperatorPrice>> {
    return {
      "Twilio": {
        cost: 1.15,
        count: 999,
        rate: 1.15
      }
    };
  }
};
