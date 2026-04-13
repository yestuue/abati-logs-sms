import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTransaction } from "@/lib/paystack";
import { grantReferralRewardInTx } from "@/lib/referral-reward";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference");

  if (!reference) {
    return NextResponse.redirect(new URL("/dashboard?error=missing_reference", req.url));
  }

  try {
    const tx = await prisma.transaction.findUnique({
      where: { reference },
      include: { user: { select: { id: true } } },
    });

    if (!tx || tx.status !== "PENDING") {
      return NextResponse.redirect(
        new URL("/dashboard?error=invalid_transaction", req.url)
      );
    }

    const paystackData = await verifyTransaction(reference);

    if (paystackData.data.status !== "success") {
      await prisma.transaction.update({
        where: { reference },
        data: { status: "FAILED" },
      });
      return NextResponse.redirect(new URL("/dashboard?error=payment_failed", req.url));
    }

    const amountPaid = paystackData.data.amount / 100; // convert from kobo

    await prisma.$transaction(async (dbtx) => {
      await dbtx.user.update({
        where: { id: tx.userId },
        data: { walletBalance: { increment: amountPaid } },
      });
      await dbtx.transaction.update({
        where: { reference },
        data: { status: "SUCCESS", amount: amountPaid },
      });
      if (tx.type === "WALLET_TOPUP") {
        await grantReferralRewardInTx(dbtx, tx.userId, amountPaid);
      }
    });

    return NextResponse.redirect(
      new URL("/dashboard?success=wallet_topped_up", req.url)
    );
  } catch {
    return NextResponse.redirect(new URL("/dashboard?error=server_error", req.url));
  }
}
