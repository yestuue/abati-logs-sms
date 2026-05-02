import crypto from "crypto";

const PAYSTACK_BASE = "https://api.paystack.co";

function resolvePaystackSecret(): string {
  const candidates = [
    process.env.PAYSTACK_LIVE_SECRET_KEY,
    process.env.PAYSTACK_SECRET_KEY,
    process.env.PAYSTACK_SECRET,
  ].filter((v): v is string => !!v && v.trim().length > 0);

  const live = candidates.find((v) => v.startsWith("sk_live_"));
  if (live) return live;

  return candidates[0] ?? "";
}

function getSecret(): string {
  const secret = resolvePaystackSecret();
  if (!secret) {
    throw new Error("Missing secret key. Set PAYSTACK_SECRET_KEY (or PAYSTACK_LIVE_SECRET_KEY).");
  }

  const isProd = process.env.NODE_ENV === "production";
  const allowTestInProd = process.env.ALLOW_PAYSTACK_TEST_IN_PROD === "true";
  if (isProd && !allowTestInProd && secret.startsWith("sk_test_")) {
    throw new Error("Production is using a test secret key (sk_test_*). Use a live key (sk_live_*).");
  }
  return secret;
}

export function verifyPaystackSignature(body: string, signature: string): boolean {
  const hash = crypto
    .createHmac("sha512", getSecret())
    .update(body)
    .digest("hex");
  return hash === signature;
}

export async function initializeTransaction(params: {
  email: string;
  amount: number; // in kobo (NGN * 100)
  currency?: string;
  reference: string;
  metadata?: Record<string, unknown>;
  callback_url?: string;
}) {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getSecret()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  return res.json() as Promise<{
    status: boolean;
    message: string;
    data: { authorization_url: string; access_code: string; reference: string };
  }>;
}

export async function verifyTransaction(reference: string) {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${getSecret()}` },
  });
  return res.json() as Promise<{
    status: boolean;
    message: string;
    data: {
      status: string;
      amount: number;
      reference: string;
      paid_at: string;
      channel: string;
      customer: { email: string };
      metadata: Record<string, unknown>;
    };
  }>;
}
