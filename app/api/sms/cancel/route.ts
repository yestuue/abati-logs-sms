import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { refundUserBalance } from "@/lib/wallet-logic";
import { cancelFiveSimOrder } from "@/lib/sms-provider";
import { z } from "zod";

const schema = z.object({
  numberId: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { numberId } = parsed.data;
    const userId = session.user.id;

    console.log(`[SMS_CANCEL] Attempting to cancel number ${numberId} for user ${userId}`);

    const number = await prisma.virtualNumber.findFirst({
      where: {
        id: numberId,
        userId,
        status: "ASSIGNED",
      },
      select: { id: true, userId: true, status: true, orderId: true },
    });

    if (!number) {
      console.warn(`[SMS_CANCEL] Number ${numberId} not found or not in ASSIGNED status for user ${userId}`);
      return NextResponse.json({ error: "Number not found or already processed" }, { status: 404 });
    }

    const purchaseTx = await prisma.transaction.findFirst({
      where: {
        userId,
        numberId,
        type: "NUMBER_PURCHASE",
        status: "SUCCESS",
      },
      orderBy: { createdAt: "desc" },
      select: { reference: true, amount: true },
    });

    if (!purchaseTx) {
      console.warn(`[SMS_CANCEL] No purchase transaction found for number ${numberId}`);
      return NextResponse.json({ error: "No successful purchase found for this number" }, { status: 400 });
    }

    // 1. Call provider to cancel
    let providerCancelled = false;
    if (number.orderId) {
      try {
        providerCancelled = await cancelFiveSimOrder(number.orderId);
        console.log(`[SMS_CANCEL] Provider cancel result for order ${number.orderId}: ${providerCancelled}`);
      } catch (err) {
        console.error(`[SMS_CANCEL] provider call failed:`, err);
      }
    }

    // We proceed with database cleanup and refund if provider cancel succeeded 
    // OR if we want to allow local cancellation (riskier if provider still charges)
    // Most users expect a refund if they click cancel and the UI says they can.
    
    if (!providerCancelled && number.orderId) {
      // If the provider rejects cancellation (e.g. SMS already received), we shouldn't refund.
      // But 5sim 'cancel' returns false if it can't be cancelled.
      return NextResponse.json({ 
        error: "Cannot cancel this order. An SMS might have already been received or the order expired." 
      }, { status: 400 });
    }

    // 2. Database Updates & Refund
    const result = await prisma.$transaction(async (tx) => {
      // Update number status
      await tx.virtualNumber.update({
        where: { id: numberId },
        data: {
          status: "CANCELLED",
          updatedAt: new Date(),
        },
      });

      // Perform refund
      return await refundUserBalance(userId, purchaseTx.amount, number.orderId || purchaseTx.reference);
    });

    return NextResponse.json({
      success: true,
      refunded: result.refunded,
      orderId: number.orderId || purchaseTx.reference,
    });

  } catch (error) {
    console.error("[SMS_CANCEL] Global Error:", error);
    return NextResponse.json({ 
      error: "An unexpected error occurred while cancelling the number." 
    }, { status: 500 });
  }
}
