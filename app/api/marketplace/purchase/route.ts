import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateReference } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  itemIds: z.array(z.string().min(1)).min(1),
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

  const userId = session.user.id;
  const itemIds = Array.from(new Set(parsed.data.itemIds));

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true },
    });
    if (!user) throw new Error("User not found");

    const items = await tx.log.findMany({
      where: { id: { in: itemIds }, status: "AVAILABLE" },
      select: { id: true, price: true, category: true },
    });
    if (items.length !== itemIds.length) {
      throw new Error("Some selected accounts are no longer available");
    }

    const total = Math.ceil(items.reduce((sum, i) => sum + (i.price || 0), 0));
    if (user.walletBalance < total) throw new Error("Insufficient wallet balance");

    await tx.user.update({
      where: { id: userId },
      data: { walletBalance: { decrement: total } },
    });

    await tx.log.updateMany({
      where: { id: { in: itemIds } },
      data: { status: "SOLD" },
    });

    const reference = generateReference();
    await tx.transaction.create({
      data: {
        userId,
        amount: total,
        currency: "NGN",
        reference,
        type: "NUMBER_PURCHASE",
        status: "SUCCESS",
        metadata: {
          kind: "marketplace_logs",
          itemIds,
          quantity: itemIds.length,
          category: items[0]?.category ?? null,
        },
      },
    });

    return { total, count: itemIds.length };
  });

  return NextResponse.json({ success: true, purchased: result.count, total: result.total });
}
