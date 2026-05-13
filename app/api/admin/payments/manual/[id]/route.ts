import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateReference } from "@/lib/utils";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { status } = body; // "APPROVED" or "REJECTED"

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const payment = await prisma.manualPayment.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.status !== "PENDING") {
      return NextResponse.json({ error: "Payment already processed" }, { status: 400 });
    }

    if (status === "APPROVED") {
      const reference = generateReference();

      await prisma.$transaction(async (tx) => {
        // Update payment status
        await tx.manualPayment.update({
          where: { id },
          data: { status: "APPROVED" },
        });

        // Credit user wallet
        await tx.user.update({
          where: { id: payment.userId },
          data: { walletBalance: { increment: payment.amount } },
        });

        // Create transaction record
        await tx.transaction.create({
          data: {
            userId: payment.userId,
            amount: payment.amount,
            currency: "NGN",
            reference,
            status: "SUCCESS",
            type: "WALLET_TOPUP",
            metadata: {
              method: "Manual Bank Transfer",
              manualPaymentId: id,
              adminEmail: session.user.email,
            },
          },
        });
      });

      return NextResponse.json({ success: true });
    } else {
      // REJECTED
      await prisma.manualPayment.update({
        where: { id },
        data: { status: "REJECTED" },
      });

      return NextResponse.json({ success: true });
    }
  } catch (err) {
    console.error("[admin_payments_manual_id] PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
