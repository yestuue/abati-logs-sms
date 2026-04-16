import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { refundUserBalance } from "@/lib/wallet-logic";

function pickOrderStatus(payload: Record<string, unknown>): string {
  const raw =
    (typeof payload.status === "string" ? payload.status : null) ??
    (typeof payload.state === "string" ? payload.state : null) ??
    (typeof payload.event === "string" ? payload.event : null) ??
    "";
  return raw.toLowerCase();
}

function isRefundableFailure(status: string): boolean {
  return ["failed", "failure", "timeout", "timed_out", "cancelled", "canceled", "expired"].includes(status);
}

export async function POST(req: Request) {
  const secret = process.env.SMS_PROVIDER_WEBHOOK_SECRET?.trim();
  const incomingSecret =
    req.headers.get("x-sms-provider-secret")?.trim() ||
    req.headers.get("x-webhook-secret")?.trim() ||
    "";
  if (!secret || incomingSecret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const status = pickOrderStatus(payload);
  if (!isRefundableFailure(status)) {
    return NextResponse.json({ success: true, ignored: true });
  }

  const orderId =
    (typeof payload.orderId === "string" ? payload.orderId : null) ??
    (typeof payload.id === "string" ? payload.id : null) ??
    (typeof payload.reference === "string" ? payload.reference : null) ??
    "";
  const numberId = typeof payload.numberId === "string" ? payload.numberId : null;

  let purchaseTx:
    | {
        userId: string;
        amount: number;
        reference: string;
        numberId: string | null;
      }
    | null = null;

  if (orderId) {
    purchaseTx = await prisma.transaction.findUnique({
      where: { reference: orderId },
      select: { userId: true, amount: true, reference: true, numberId: true },
    });
  }
  if (!purchaseTx && numberId) {
    purchaseTx = await prisma.transaction.findFirst({
      where: {
        numberId,
        type: "NUMBER_PURCHASE",
        status: "SUCCESS",
      },
      orderBy: { createdAt: "desc" },
      select: { userId: true, amount: true, reference: true, numberId: true },
    });
  }

  if (!purchaseTx) {
    return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
  }

  if (purchaseTx.numberId) {
    await prisma.virtualNumber.updateMany({
      where: { id: purchaseTx.numberId, status: "ASSIGNED" },
      data: {
        status: "AVAILABLE",
        userId: null,
        assignedAt: null,
        expiresAt: null,
      },
    });
  }

  const refund = await refundUserBalance(
    purchaseTx.userId,
    purchaseTx.amount,
    orderId || purchaseTx.reference
  );
  return NextResponse.json({ success: true, refunded: refund.refunded });
}
