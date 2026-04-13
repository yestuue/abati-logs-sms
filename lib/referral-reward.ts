import type { Prisma } from "@prisma/client";
import { generateReference } from "@/lib/utils";

function computeRewardAmount(topupAmountNGN: number): number {
  const pctRaw = process.env.REFERRAL_REWARD_PERCENT;
  const flat = Number(process.env.REFERRAL_REWARD_NGN ?? "500");
  if (pctRaw != null && pctRaw !== "" && !Number.isNaN(Number(pctRaw)) && topupAmountNGN > 0) {
    const fromPct = Math.round(topupAmountNGN * (Number(pctRaw) / 100));
    return Math.max(1, fromPct);
  }
  if (!Number.isFinite(flat) || flat < 1) return 500;
  return Math.round(flat);
}

/**
 * After a wallet top-up is marked SUCCESS inside the same DB transaction,
 * credits the referrer once (guarded by referralBonusGranted).
 */
export async function grantReferralRewardInTx(
  tx: Prisma.TransactionClient,
  toppedUpUserId: string,
  topupAmountNGN: number
): Promise<{ granted: boolean; amount?: number }> {
  const prior = await tx.user.findUnique({
    where: { id: toppedUpUserId },
    select: { referredById: true, referralBonusGranted: true },
  });
  if (!prior?.referredById || prior.referralBonusGranted) {
    return { granted: false };
  }

  const successTopups = await tx.transaction.count({
    where: { userId: toppedUpUserId, type: "WALLET_TOPUP", status: "SUCCESS" },
  });
  if (successTopups < 1) {
    return { granted: false };
  }

  const lock = await tx.user.updateMany({
    where: {
      id: toppedUpUserId,
      referralBonusGranted: false,
      referredById: { not: null },
    },
    data: { referralBonusGranted: true },
  });
  if (lock.count === 0) {
    return { granted: false };
  }

  let rewardBase = topupAmountNGN;
  if (!rewardBase || rewardBase <= 0) {
    const first = await tx.transaction.findFirst({
      where: { userId: toppedUpUserId, type: "WALLET_TOPUP", status: "SUCCESS" },
      orderBy: { createdAt: "asc" },
    });
    rewardBase = first?.amount ?? 0;
  }

  const reward = computeRewardAmount(rewardBase);
  const referrerId = prior.referredById;

  await tx.user.update({
    where: { id: referrerId },
    data: {
      walletBalance: { increment: reward },
      referralEarnings: { increment: reward },
    },
  });

  await tx.transaction.create({
    data: {
      userId: referrerId,
      amount: reward,
      currency: "NGN",
      reference: generateReference(),
      type: "REFERRAL_REWARD",
      status: "SUCCESS",
      metadata: {
        referredUserId: toppedUpUserId,
        topupAmountNGN: rewardBase,
      } as object,
    },
  });

  return { granted: true, amount: reward };
}
