import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveProvider } from "@/lib/sms-providers";


export async function GET(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId } = await params;

  try {
    const vn = await prisma.virtualNumber.findFirst({
      where: { orderId: String(orderId) },
      select: { id: true, userId: true, server: true }
    });

    if (!vn) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const provider = await getActiveProvider(vn.server);
    const activation = await provider.checkOrder(orderId);
    
    if (!activation) {
      return NextResponse.json({ error: "Order expired or not found on provider" }, { status: 404 });
    }
    // Update SMS messages in database if any new ones arrived
    if (activation.sms && activation.sms.length > 0) {
      for (const sms of activation.sms) {
        // Check if SMS already exists
        const existing = await prisma.sMS.findFirst({
          where: {
            numberId: vn.id,
            body: sms.text,
            createdAt: {
              gte: new Date(new Date(sms.date).getTime() - 1000),
              lte: new Date(new Date(sms.date).getTime() + 1000),
            }
          }
        });

        if (!existing) {
          await prisma.sMS.create({
            data: {
              body: sms.text,
              from: sms.from,
              to: activation.phone,
              userId: vn.userId!,
              numberId: vn.id,
              createdAt: new Date(sms.date),
            }
          });
        }
      }
    }

    return NextResponse.json({
      status: activation.status,
      phone: activation.phone,
      sms: activation.sms,
      expires: activation.expires,
    });
  } catch (error) {
    console.error("[otp-status] Error:", error);
    return NextResponse.json({ error: "Failed to check OTP status" }, { status: 500 });
  }
}
