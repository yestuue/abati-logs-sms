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
      include: { smsMessages: true }
    });

    if (!vn) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const { getProvider } = await import("@/lib/sms-providers");
    const provider = getProvider(vn.server);
    const success = await provider.cancelOrder(orderId);
    
    if (!success) {
      return NextResponse.json({ error: "Failed to cancel order on provider" }, { status: 502 });
    }

    if (vn && vn.smsMessages.length === 0) {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: vn.userId! },
          data: { walletBalance: { increment: vn.priceNGN } }
        }),
        prisma.virtualNumber.update({
          where: { id: vn.id },
          data: { status: "EXPIRED" } // Or a new status like CANCELLED
        }),
        prisma.transaction.create({
          data: {
            userId: vn.userId!,
            amount: vn.priceNGN,
            currency: "NGN",
            reference: `REFUND-${orderId}-${Date.now()}`,
            status: "SUCCESS",
            type: "REFUND",
            metadata: { orderId, reason: "User cancelled" }
          }
        })
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[cancel] Error:", error);
    return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 });
  }
}
