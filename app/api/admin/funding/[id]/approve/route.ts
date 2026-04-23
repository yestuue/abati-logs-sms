import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateReference } from "@/lib/utils";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await prisma.$transaction(async (tx) => {
      const request = await tx.manualFundingRequest.findUnique({
        where: { id },
        select: { id: true, userId: true, amount: true, currency: true, status: true },
      });

      if (!request) {
        throw new Error("NOT_FOUND");
      }
      if (request.status !== "PENDING") {
        throw new Error("ALREADY_REVIEWED");
      }

      await tx.user.update({
        where: { id: request.userId },
        data: { walletBalance: { increment: request.amount } },
      });

      await tx.transaction.create({
        data: {
          userId: request.userId,
          amount: request.amount,
          currency: request.currency,
          reference: generateReference(),
          status: "SUCCESS",
          type: "WALLET_TOPUP",
          metadata: {
            source: "manual_funding",
            requestId: request.id,
            approvedBy: session.user.id,
          },
        },
      });

      await tx.manualFundingRequest.update({
        where: { id: request.id },
        data: {
          status: "APPROVED",
          reviewedAt: new Date(),
          reviewedById: session.user.id,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Funding request not found" }, { status: 404 });
    }
    if (error instanceof Error && error.message === "ALREADY_REVIEWED") {
      return NextResponse.json({ error: "Funding request already reviewed" }, { status: 409 });
    }
    console.error("Approve funding failed:", error);
    return NextResponse.json({ error: "Failed to approve request" }, { status: 500 });
  }
}
