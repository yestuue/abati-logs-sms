import { randomBytes } from "crypto";
import type { Prisma, PrismaClient } from "@prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

export async function assignUniqueReferralCode(db: Db, userId: string): Promise<string> {
  const existing = await db.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });
  if (existing?.referralCode) return existing.referralCode;

  for (let i = 0; i < 24; i++) {
    const code = randomBytes(4).toString("hex").slice(0, 8);
    const updated = await db.user.updateMany({
      where: { id: userId, referralCode: null },
      data: { referralCode: code },
    });
    if (updated.count === 1) return code;
    const again = await db.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });
    if (again?.referralCode) return again.referralCode;
  }
  throw new Error("Could not assign referral code");
}

export async function ensureUserReferralCode(db: Db, userId: string): Promise<string> {
  const row = await db.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });
  if (row?.referralCode) return row.referralCode;
  return assignUniqueReferralCode(db, userId);
}
