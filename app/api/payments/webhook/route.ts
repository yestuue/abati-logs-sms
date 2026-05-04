import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyFlutterwaveSignature } from "@/lib/flutterwave";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("verif-hash") ?? ""; // Flutterwave uses verif-hash

  if (!verifyFlutterwaveSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    const event = JSON.parse(rawBody);

    if (event.status === "successful" || event["event.type"] === "CARD_TRANSACTION") {
      const { tx_ref, amount } = event.data || event;
      const amountNGN = amount;

      const tx = await prisma.transaction.findUnique({ where: { reference: tx_ref } });
      if (!tx || tx.status === "SUCCESS") {
        return NextResponse.json({ received: true });
      }

      await prisma.$transaction(async (dbtx) => {
        await dbtx.user.update({
          where: { id: tx.userId },
          data: { walletBalance: { increment: amountNGN } },
        });
        await dbtx.transaction.update({
          where: { reference: tx_ref },
          data: { status: "SUCCESS", amount: amountNGN },
        });
      });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("WEBHOOK_ERROR:", err);
    return NextResponse.json({ error: "Processing error" }, { status: 500 });
  }
}
