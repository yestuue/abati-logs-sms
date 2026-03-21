import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initializeTransaction } from "@/lib/paystack";
import { generateReference } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  type: z.enum(["WALLET_TOPUP", "NUMBER_PURCHASE"]),
  amount: z.number().positive(),
  numberId: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { type, amount, numberId } = parsed.data;
    const userId = session.user.id;
    const email = session.user.email;

    // For NUMBER_PURCHASE via wallet debit (no Paystack)
    if (type === "NUMBER_PURCHASE" && numberId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { walletBalance: true },
      });
      const number = await prisma.virtualNumber.findUnique({
        where: { id: numberId, status: "AVAILABLE" },
      });

      if (!number) {
        return NextResponse.json({ error: "Number not available" }, { status: 400 });
      }

      if ((user?.walletBalance ?? 0) < number.priceNGN) {
        return NextResponse.json({ error: "Insufficient wallet balance" }, { status: 400 });
      }

      const reference = generateReference();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      // Atomic: debit wallet + assign number + create transaction
      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { walletBalance: { decrement: number.priceNGN } },
        }),
        prisma.virtualNumber.update({
          where: { id: numberId },
          data: {
            status: "ASSIGNED",
            userId,
            assignedAt: new Date(),
            expiresAt,
          },
        }),
        prisma.transaction.create({
          data: {
            userId,
            amount: number.priceNGN,
            currency: "NGN",
            reference,
            status: "SUCCESS",
            type: "NUMBER_PURCHASE",
            server: number.server,
            numberId,
          },
        }),
      ]);

      return NextResponse.json({ success: true, number: number.number, expiresAt });
    }

    // Wallet top-up via Paystack
    const reference = generateReference();
    const amountKobo = Math.round(amount * 100);
    const callbackUrl = `${process.env.NEXTAUTH_URL}/api/payments/verify?reference=${reference}`;

    const paystackRes = await initializeTransaction({
      email,
      amount: amountKobo,
      reference,
      callback_url: callbackUrl,
      metadata: {
        userId,
        type,
        amount,
      },
    });

    if (!paystackRes.status) {
      return NextResponse.json({ error: "Payment initialization failed" }, { status: 502 });
    }

    // Create pending transaction
    await prisma.transaction.create({
      data: {
        userId,
        amount,
        currency: "NGN",
        reference,
        status: "PENDING",
        type: "WALLET_TOPUP",
      },
    });

    return NextResponse.json({ url: paystackRes.data.authorization_url, reference });
  } catch (err) {
    console.error("Payment init error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
