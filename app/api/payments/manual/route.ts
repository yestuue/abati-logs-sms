import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const manualPaymentSchema = z.object({
  amount: z.number().positive(),
  email: z.string().email(),
  screenshot: z.string(), // base64 string
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = manualPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { amount, email, screenshot } = parsed.data;

    const payment = await prisma.manualPayment.create({
      data: {
        userId: session.user.id,
        amount,
        email,
        screenshot, // Storing base64 directly for now. In production, upload to S3/Cloudinary.
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true, payment });
  } catch (err) {
    console.error("[manual_payment] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
