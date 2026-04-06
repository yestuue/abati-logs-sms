import { NextResponse } from "next/server";
import { sendSMS } from "@/lib/sms";

export async function GET() {
  const testPhoneNumber = "+2349049386397";
  const message = "Abati Live Test: SMS is working!";

  try {
    const result = await sendSMS(testPhoneNumber, message);

    if (result) {
      return NextResponse.json({ success: true, message: "SMS sent" });
    } else {
      console.error("[Test Route Error] sendSMS returned null. Check Vercel logs for Twilio output.");
      return NextResponse.json(
        { success: false, error: "Failed to send SMS. Check your server logs for Twilio errors." },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[Test Route Error] Exception in GET handler:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}