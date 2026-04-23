import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ManualFundingStatus } from "@prisma/client";

export async function GET(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const statusFilter =
    status === "PENDING" || status === "APPROVED" || status === "REJECTED"
      ? (status as ManualFundingStatus)
      : undefined;
  const where =
    statusFilter ? { status: statusFilter } : undefined;

  const requests = await prisma.manualFundingRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      amount: true,
      currency: true,
      proofUrl: true,
      note: true,
      status: true,
      createdAt: true,
      reviewedAt: true,
      user: {
        select: { id: true, name: true, email: true },
      },
      reviewedBy: {
        select: { id: true, email: true, name: true },
      },
    },
  });

  return NextResponse.json({ requests });
}
