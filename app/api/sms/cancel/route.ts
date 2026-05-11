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
      include: { 
        smsMessages: {
          take: 1
        }
      },
    });

    if (!number) {
      console.warn(`[SMS_CANCEL] Number ${numberId} not found or not in ASSIGNED status for user ${userId}`);
      return NextResponse.json({ error: "Number not found or already processed" }, { status: 404 });
    }

    // Check if OTP has been used/received
    if (number.smsMessages.length > 0) {
      console.warn(`[SMS_CANCEL] Number ${numberId} has received SMS, cancellation blocked.`);
      return NextResponse.json({ 
        error: "Cannot cancel a number that has already received an SMS/OTP." 
      }, { status: 400 });
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
        const { cancelOrder } = await import("@/lib/sms-provider");
        providerCancelled = await cancelOrder(number.server, number.orderId);
        console.log(`[SMS_CANCEL] Provider cancel result for order ${number.orderId}: ${providerCancelled}`);
      } catch (err) {
        console.error(`[SMS_CANCEL] provider call failed:`, err);
      }
    }

    // If the provider rejects cancellation (e.g. SMS already received on their end), we shouldn't refund.
    if (!providerCancelled && number.orderId) {
      return NextResponse.json({ 
        error: "Cannot cancel this order. The provider reported that it might have already expired or received an OTP." 
      }, { status: 400 });
    }

    // 2. Database Updates & Instant Refund
    const result = await prisma.$transaction(async (tx) => {
      // Update number status to CANCELLED to prevent further use
      await tx.virtualNumber.update({
        where: { id: numberId },
        data: {
          status: "CANCELLED",
          updatedAt: new Date(),
        },
      });

      // Perform instant refund to user wallet
      const refund = await refundUserBalance(userId, purchaseTx.amount, number.orderId || purchaseTx.reference);
      
      return refund;
    });

    if (result.refunded) {
      console.log(`[SMS_CANCEL] Instant refund of ${purchaseTx.amount} completed for user ${userId}`);
    }

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
