import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Termii Inbound Webhook
// POST /api/sms/inbound
// Payload: { to, from, text, id, date }
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Termii sends: { to, from, text, id, date, ... }
    const to = body.to as string | undefined;
    const from = body.from ?? body.sender ?? "";
    const text = body.text ?? body.sms ?? body.body ?? "";

    if (!to || !from || !text) {
      return NextResponse.json(
        { error: "Missing required fields: to, from, text" },
        { status: 400 }
      );
    }

    // Normalize the number — Termii may omit leading +
    const normalizedTo = to.startsWith("+") ? to : `+${to}`;

    // Find the virtual number in our DB
    const virtualNumber = await prisma.virtualNumber.findFirst({
      where: {
        number: {
          in: [to, normalizedTo],
        },
        status: "ASSIGNED",
      },
    });

    if (!virtualNumber || !virtualNumber.userId) {
      // Log unknown number but still return 200 to Termii
      console.warn(`[SMS Inbound] Unknown number: ${to}`);
      return NextResponse.json({ ok: true, routed: false });
    }

    // Save SMS and route to user
    await prisma.sMS.create({
      data: {
        userId: virtualNumber.userId,
        numberId: virtualNumber.id,
        from,
        to: normalizedTo,
        body: text,
        raw: body,
        read: false,
      },
    });

    return NextResponse.json({ ok: true, routed: true, userId: virtualNumber.userId });
  } catch (err) {
    console.error("[SMS Inbound] Error:", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
