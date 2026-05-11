import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";


export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId } = await params;

  try {
    const vn = await prisma.virtualNumber.findFirst({
      where: { orderId: String(orderId) },
      select: { server: true }
    });

    if (!vn) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const { getProvider } = await import("@/lib/sms-providers");
    const provider = getProvider(vn.server);
    const success = await provider.banOrder(orderId);
    
    if (!success) {
      return NextResponse.json({ error: "Failed to ban order on provider" }, { status: 502 });
    }

    // Check if OTP has been used/received for refund logic
    const fullVn = await prisma.virtualNumber.findUnique({
      where: { orderId: String(orderId) },
      include: { smsMessages: true }
    });

    if (fullVn && fullVn.smsMessages.length === 0) {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: fullVn.userId! },
          data: { walletBalance: { increment: fullVn.priceNGN } }
        }),
        prisma.virtualNumber.update({
          where: { id: fullVn.id },
          data: { status: "SUSPENDED" }
        }),
        prisma.transaction.create({
          data: {
            userId: fullVn.userId!,
            amount: fullVn.priceNGN,
            currency: "NGN",
            reference: `REFUND-BAN-${orderId}-${Date.now()}`,
            status: "SUCCESS",
            type: "REFUND",
            metadata: { orderId, reason: "User banned number" }
          }
        })
      ]);
      return NextResponse.json({ success: true, refunded: true });
    }

    // Mark as suspended/banned in DB without refund if SMS was received
    await prisma.virtualNumber.updateMany({
      where: { orderId: String(orderId) },
      data: { status: "SUSPENDED" }
    });

    return NextResponse.json({ success: true, refunded: false });
  } catch (error) {
    console.error("[ban] Error:", error);
    return NextResponse.json({ error: "Failed to ban order" }, { status: 500 });
  }
}
