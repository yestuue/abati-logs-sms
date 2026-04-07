import { NextResponse } from "next/server";
import { sendSMS } from "@/lib/sms";

export async function GET() {
  const to = "+2349049386397";
  const message = "Abati Live: SMS is working!";

  try {
    const result = await sendSMS(to, message);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}