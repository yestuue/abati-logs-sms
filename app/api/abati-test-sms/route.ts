import { NextResponse } from "next/server";
import { sendSMS } from "@/lib/sms";

export async function GET() {
  const to      = "+2349049386397";
  const message = "Abati Live Test: SMS is working!";
  const from    = process.env.TWILIO_PHONE_NUMBER;

  try {
    console.log('Using SID:', process.env.TWILIO_ACCOUNT_SID?.substring(0, 5) + '...');

    const result = await sendSMS(to, message, from);

    if (result) {
      return NextResponse.json({ success: true, sid: result.sid });
    }

    return NextResponse.json(
      { success: false, error: "sendSMS returned null — check Twilio credentials in Vercel env vars" },
      { status: 500 }
    );
  } catch (error) {
    console.error("[abati-test-sms] error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}