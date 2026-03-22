import crypto from "crypto";

const PAYSTACK_BASE = "https://api.paystack.co";

function getSecret(): string {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    throw new Error("[Paystack] PAYSTACK_SECRET_KEY is not set in environment variables.");
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
