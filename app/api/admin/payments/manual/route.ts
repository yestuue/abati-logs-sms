import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payments = await prisma.manualPayment.findMany({
      include: {
        user: {
          select: {
            username: true,
            email: true,
            walletBalance: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ payments });
  } catch (err) {
    console.error("[admin_payments_manual] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
