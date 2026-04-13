import type { Prisma } from "@prisma/client";

type TxClient = Prisma.TransactionClient;
import { generateReference } from "@/lib/utils";

function maxReferrerOrderRewards(): number {
  const n = Number(process.env.REFERRAL_REFERRER_MAX_ORDERS ?? "3");
  if (!Number.isFinite(n) || n < 1) return 3;
  return Math.min(10, Math.floor(n));
}

function orderCommissionPercent(): number {
  const p = Number(process.env.REFERRAL_ORDER_PERCENT ?? "5");
  if (!Number.isFinite(p) || p <= 0) return 5;
  return Math.min(100, p);
}

/**
 * After a successful virtual-number wallet purchase (NUMBER_PURCHASE) in the same DB transaction,
 * credits the referrer a percentage of the charged amount for up to the first N purchases by the buyer.
 */
export async function grantReferralPurchaseCommissionInTx(
  tx: TxClient,
  buyerUserId: string,
  orderAmountNGN: number
): Promise<{ granted: boolean; amount?: number }> {
  const cap = maxReferrerOrderRewards();
  const pct = orderCommissionPercent();

  const lock = await tx.user.updateMany({
    where: {
      id: buyerUserId,
      referredById: { not: null },
      referralPurchaseRewardsCount: { lt: cap },
    },
    data: { referralPurchaseRewardsCount: { increment: 1 } },
  });
  if (lock.count === 0) {
    return { granted: false };
  }

  const buyer = await tx.user.findUnique({
    where: { id: buyerUserId },
    select: { referredById: true, referralPurchaseRewardsCount: true },
  });
  if (!buyer?.referredById) {
    return { granted: false };
  }

  const commission = Math.max(1, Math.round(orderAmountNGN * (pct / 100)));
  const referrerId = buyer.referredById;

  await tx.user.update({
    where: { id: referrerId },
    data: {
      walletBalance: { increment: commission },
      referralEarnings: { increment: commission },
    },
  });

  await tx.transaction.create({
    data: {
      userId: referrerId,
      amount: commission,
      currency: "NGN",
      reference: generateReference(),
      type: "REFERRAL_REWARD",
      status: "SUCCESS",
      metadata: {
        referredUserId: buyerUserId,
        orderAmountNGN,
        commissionPercent: pct,
        purchaseRewardIndex: buyer.referralPurchaseRewardsCount,
      } as object,
    },
  });

  return { granted: true, amount: commission };
}
