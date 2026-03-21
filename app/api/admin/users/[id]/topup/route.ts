import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateReference } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  amount: z.number().positive(),
  currency: z.enum(["NGN", "USD"]).default("NGN"),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: userId } = await params;

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const { amount, currency } = parsed.data;
    const reference = generateReference();

    const [user] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { walletBalance: { increment: amount } },
      }),
      prisma.transaction.create({
        data: {
          userId,
          amount,
          currency,
          reference,
          status: "SUCCESS",
          type: "ADMIN_CREDIT",
          metadata: { creditedBy: session.user.id },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      newBalance: user.walletBalance,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
