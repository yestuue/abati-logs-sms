import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { refundUserBalance } from "@/lib/wallet-logic";
import { z } from "zod";

const schema = z.object({
  numberId: z.string().min(1),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { numberId } = parsed.data;
  const userId = session.user.id;

  const number = await prisma.virtualNumber.findFirst({
    where: {
      id: numberId,
      userId,
      status: "ASSIGNED",
    },
    select: { id: true, userId: true, status: true },
  });
  if (!number) {
    return NextResponse.json({ error: "Number not found for this user" }, { status: 404 });
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
    return NextResponse.json({ error: "No successful purchase found for this number" }, { status: 400 });
  }

  // Release number assignment immediately on user cancellation.
  await prisma.virtualNumber.update({
    where: { id: numberId },
    data: {
      status: "AVAILABLE",
      userId: null,
      assignedAt: null,
      expiresAt: null,
    },
  });

  const refund = await refundUserBalance(userId, purchaseTx.amount, purchaseTx.reference);
  return NextResponse.json({
    success: true,
    refunded: refund.refunded,
    orderId: purchaseTx.reference,
  });
}
