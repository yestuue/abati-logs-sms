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

    // Mark as suspended/banned in DB
    await prisma.virtualNumber.updateMany({
      where: { orderId: String(orderId) },
      data: { status: "SUSPENDED" }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ban] Error:", error);
    return NextResponse.json({ error: "Failed to ban order" }, { status: 500 });
  }
}
