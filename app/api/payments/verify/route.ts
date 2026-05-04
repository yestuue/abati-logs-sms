import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyFlutterwaveTransaction } from "@/lib/flutterwave";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const tx_ref = searchParams.get("tx_ref");
  const transaction_id = searchParams.get("transaction_id");

  if (!tx_ref || !transaction_id) {
    return NextResponse.redirect(new URL("/dashboard/wallet?error=missing_reference", req.url));
  }

  try {
    const tx = await prisma.transaction.findUnique({
      where: { reference: tx_ref },
      include: { user: { select: { id: true } } },
    });

    if (!tx || tx.status !== "PENDING") {
      return NextResponse.redirect(
        new URL("/dashboard/wallet?error=invalid_transaction", req.url)
      );
    }

    const flwRes = await verifyFlutterwaveTransaction(transaction_id);

    if (flwRes.status !== "success" || flwRes.data.status !== "successful") {
      await prisma.transaction.update({
        where: { reference: tx_ref },
        data: { status: "FAILED" },
      });
      return NextResponse.redirect(new URL("/dashboard/wallet?error=payment_failed", req.url));
    }

    const amountPaid = flwRes.data.amount;

    await prisma.$transaction(async (dbtx) => {
      await dbtx.user.update({
        where: { id: tx.userId },
        data: { walletBalance: { increment: amountPaid } },
      });
      await dbtx.transaction.update({
        where: { reference: tx_ref },
        data: { status: "SUCCESS", amount: amountPaid },
      });
    });

    return NextResponse.redirect(
      new URL("/dashboard/wallet?success=wallet_topped_up", req.url)
    );
  } catch (err) {
    console.error("VERIFY_ERROR:", err);
    return NextResponse.redirect(new URL("/dashboard/wallet?error=server_error", req.url));
  }
}
