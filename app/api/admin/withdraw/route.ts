import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { amount, bankInfo } = await req.json() as { amount: number; bankInfo: string };

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    if (!bankInfo?.trim()) {
      return NextResponse.json({ error: "Bank details are required" }, { status: 400 });
    }

    const request = await prisma.withdrawalRequest.create({
      data: {
        amount,
        bankDetails: bankInfo.trim(),
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true, id: request.id }, { status: 201 });
  } catch (err) {
    console.error("[admin/withdraw] Error:", err);
    return NextResponse.json({ error: "Failed to submit withdrawal request" }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const requests = await prisma.withdrawalRequest.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ requests });
}
