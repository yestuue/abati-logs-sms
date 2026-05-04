import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        walletBalance: true,
        walletCurrency: true,
      },
    });

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        amount: true,
        type: true,
        status: true,
        reference: true,
        createdAt: true,
      }
    });

    // Calculate stats
    const totalFunded = await prisma.transaction.aggregate({
      where: {
        userId,
        type: "WALLET_TOPUP",
        status: "SUCCESS",
      },
      _sum: {
        amount: true,
      }
    });

    const totalSpent = await prisma.transaction.aggregate({
      where: {
        userId,
        type: "NUMBER_PURCHASE",
        status: "SUCCESS",
      },
      _sum: {
        amount: true,
      }
    });

    return NextResponse.json({
      balance: user?.walletBalance ?? 0,
      currency: user?.walletCurrency ?? "NGN",
      transactions,
      stats: {
        totalFunded: totalFunded._sum.amount ?? 0,
        totalSpent: totalSpent._sum.amount ?? 0,
      }
    });
  } catch (error) {
    console.error("Failed to fetch wallet data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
