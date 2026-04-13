import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { grantReferralRewardInTx } from "@/lib/referral-reward";
import { z } from "zod";

const bodySchema = z.object({
  userId: z.string().optional(),
  topupAmountNGN: z.number().nonnegative().optional(),
});

/**
 * Re-evaluates referral reward for a user after at least one successful wallet top-up.
 * Idempotent via referralBonusGranted. Used for recovery/testing; normal flow runs in payment verify/webhook.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let parsed: z.infer<typeof bodySchema>;
  try {
    const json = await req.json().catch(() => ({}));
    parsed = bodySchema.parse(json);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let targetUserId = session.user.id;
  if (parsed.userId && parsed.userId !== session.user.id) {
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    targetUserId = parsed.userId;
  }

  const amountHint = parsed.topupAmountNGN ?? 0;

  try {
    const result = await prisma.$transaction(async (tx) =>
      grantReferralRewardInTx(tx, targetUserId, amountHint)
    );
    return NextResponse.json(result);
  } catch (e) {
    console.error("[referral/reward]", e);
    return NextResponse.json({ error: "Reward processing failed" }, { status: 500 });
  }
}
