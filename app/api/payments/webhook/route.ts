import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPaystackSignature } from "@/lib/paystack";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature") ?? "";

  if (!verifyPaystackSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    const event = JSON.parse(rawBody);

    if (event.event === "charge.success") {
      const { reference, amount } = event.data;
      const amountNGN = amount / 100;

      const tx = await prisma.transaction.findUnique({ where: { reference } });
      if (!tx || tx.status === "SUCCESS") {
        return NextResponse.json({ received: true });
      }

      await prisma.$transaction(async (dbtx) => {
        await dbtx.user.update({
          where: { id: tx.userId },
          data: { walletBalance: { increment: amountNGN } },
        });
        await dbtx.transaction.update({
          where: { reference },
          data: { status: "SUCCESS", amount: amountNGN },
        });
      });
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Processing error" }, { status: 500 });
  }
}
