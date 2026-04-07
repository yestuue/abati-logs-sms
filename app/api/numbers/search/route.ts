import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { calculateFinalNGN } from "@/lib/pricing";

// Twilio credentials from environment
const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN  = process.env.TWILIO_AUTH_TOKEN;

// Map service names → typical area codes for availability searches
const SERVICE_AREA_CODE: Record<string, string> = {
  whatsapp:    "415",
  telegram:    "646",
  facebook:    "212",
  instagram:   "310",
  tiktok:      "312",
  gmail:       "408",
  google:      "408",
  textplus:    "917",
  textnow:     "720",
  talkatone:   "213",
  nextplus:    "469",
  "google voice": "650",
};

interface TwilioNumber {
  friendly_name: string;
  phone_number: string;
  lata: string | null;
  rate_center: string | null;
  locality: string | null;
  region: string | null;
  iso_country: string;
  capabilities: {
    voice: boolean;
    SMS: boolean;
    MMS: boolean;
  };
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!ACCOUNT_SID || !AUTH_TOKEN) {
    return NextResponse.json(
      { error: "Twilio credentials not configured" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(req.url);
  let service = (searchParams.get("service") ?? "").toLowerCase().trim();
  service = service.replace(/\bwhasapp\b/g, "whatsapp");
  const country  = (searchParams.get("country") ?? "US").toUpperCase();
  const limit    = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);

  const areaCode = SERVICE_AREA_CODE[service] ?? "";
  const base64   = Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString("base64");

  const url = new URL(
    `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/AvailablePhoneNumbers/${country}/Local.json`
  );
  url.searchParams.set("SmsEnabled", "true");
  url.searchParams.set("PageSize",   String(limit));
  if (areaCode) url.searchParams.set("AreaCode", areaCode);

  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Basic ${base64}` },
      // Next.js 15: never cache Twilio availability — numbers change in real time
      cache: "no-store",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[numbers/search] Twilio error:", err);
      return NextResponse.json(
        { error: err.message ?? "Failed to fetch numbers from Twilio" },
        { status: res.status }
      );
    }

    const twilio = await res.json() as { available_phone_numbers: TwilioNumber[] };
    const numbers = twilio.available_phone_numbers ?? [];

    const priceNGN = calculateFinalNGN(1);
    const priceUSD = Math.round((priceNGN / 1500) * 100) / 100;

    const results = numbers.map((n) => ({
      phoneNumber:  n.phone_number,
      friendlyName: n.friendly_name,
      region:       n.region ?? n.locality ?? "",
      country:      n.iso_country,
      smsEnabled:   n.capabilities?.SMS ?? false,
      priceNGN,
      priceUSD,
    }));

    return NextResponse.json({ numbers: results, service, total: results.length });
  } catch (err) {
    console.error("[numbers/search] Network error:", err);
    return NextResponse.json({ error: "Network error contacting Twilio" }, { status: 502 });
  }
}
