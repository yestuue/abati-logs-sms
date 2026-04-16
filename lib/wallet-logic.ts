import { prisma } from "@/lib/prisma";
import { generateReference } from "@/lib/utils";

type RefundResult = {
  refunded: boolean;
  transactionId?: string;
};

/**
 * Idempotent wallet refund:
 * - credits wallet once per orderId
 * - records REFUND transaction with SUCCESS status
 */
export async function refundUserBalance(
  userId: string,
  amount: number,
  orderId: string
): Promise<RefundResult> {
  const normalizedAmount = Number(amount);
  const normalizedOrderId = String(orderId ?? "").trim();
  if (!userId || !normalizedOrderId || !Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    return { refunded: false };
  }

  return prisma.$transaction(async (tx) => {
    const existing = await tx.transaction.findFirst({
      where: {
        userId,
        type: "REFUND",
        status: "SUCCESS",
        OR: [
          { reference: `REFUND-${normalizedOrderId}` },
          { metadata: { path: ["orderId"], equals: normalizedOrderId } },
        ],
      },
      select: { id: true },
    });
    if (existing) return { refunded: false, transactionId: existing.id };

    await tx.user.update({
      where: { id: userId },
      data: { walletBalance: { increment: normalizedAmount } },
    });

    const created = await tx.transaction.create({
      data: {
        userId,
        amount: normalizedAmount,
        currency: "NGN",
        reference: `REFUND-${normalizedOrderId}`,
        type: "REFUND",
        status: "SUCCESS",
        metadata: {
          orderId: normalizedOrderId,
          reason: "sms_order_cancellation",
          message: `Refund for cancelled SMS order #${normalizedOrderId}`,
          syntheticReference: generateReference(),
        },
      },
      select: { id: true },
    });

    return { refunded: true, transactionId: created.id };
  });
}
