import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isPrivilegedAdminEmail } from "@/lib/admin-access";

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

export async function GET() {
  const session = await auth();
  const isAdmin =
    !!session &&
    (session.user.role === "ADMIN" || isPrivilegedAdminEmail(session.user.email));

  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const secret = resolvePaystackSecret();
  const mode =
    !secret
      ? "missing"
      : secret.startsWith("sk_live_")
        ? "live"
        : secret.startsWith("sk_test_")
          ? "test"
          : "unknown";

  return NextResponse.json({
    provider: "paystack",
    mode,
    checks: {
      hasSecret: !!secret,
      hasCallbackUrl: !!process.env.PAYSTACK_CALLBACK_URL,
      hasWebhookSecret: !!process.env.PAYSTACK_WEBHOOK_SECRET,
      allowTestInProd: process.env.ALLOW_PAYSTACK_TEST_IN_PROD === "true",
    },
    env: process.env.NODE_ENV ?? "development",
    timestamp: new Date().toISOString(),
  });
}
