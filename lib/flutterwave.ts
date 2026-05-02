import crypto from "crypto";

const FLUTTERWAVE_BASE = "https://api.flutterwave.com/v3";

function getSecret(): string {
  const secret = process.env.FLW_SECRET_KEY || process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secret) {
    throw new Error("Missing secret key. Set FLW_SECRET_KEY.");
  }
  return secret;
}

export async function initializeFlutterwavePayment(params: {
  tx_ref: string;
  amount: number;
  currency: string;
  redirect_url: string;
  customer: {
    email: string;
    phonenumber?: string;
    name?: string;
  };
  customizations?: {
    title?: string;
    description?: string;
    logo?: string;
  };
}) {
  const res = await fetch(`${FLUTTERWAVE_BASE}/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getSecret()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  return res.json() as Promise<{
    status: string;
    message: string;
    data: {
      link: string;
    };
  }>;
}

export function verifyFlutterwaveSignature(body: string, signature: string): boolean {
  const secretHash = process.env.FLW_SECRET_HASH || process.env.FLUTTERWAVE_SECRET_HASH;
  if (!secretHash) return false;
  return signature === secretHash;
}
