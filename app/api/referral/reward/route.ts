import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { grantReferralPurchaseCommissionInTx } from "@/lib/referral-reward";
import { z } from "zod";

const bodySchema = z.object({
  /** Buyer user id (referred user who placed the number order). */
  userId: z.string().min(1),
  /** Charged NGN for that order (same as NUMBER_PURCHASE transaction amount). */
  orderAmountNGN: z.number().positive(),
});

/**
 * Admin-only: apply one referral purchase commission slot (first 3 orders per referred user).
 * Normal flow runs inside `payments/initialize` when a number is purchased.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) =>
      grantReferralPurchaseCommissionInTx(tx, parsed.userId, parsed.orderAmountNGN)
    );
    return NextResponse.json(result);
  } catch (e) {
    console.error("[referral/reward]", e);
    return NextResponse.json({ error: "Reward processing failed" }, { status: 500 });
  }
}
