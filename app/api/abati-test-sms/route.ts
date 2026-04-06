import { NextResponse } from "next/server";
import { sendSMS } from "@/lib/sms";

export async function GET() {
  const testPhoneNumber = "[YOUR_PHONE_NUMBER]";
  const message = "Abati Live Test: Your SMS API is now fully integrated!";

  try {
    const result = await sendSMS(testPhoneNumber, message);

    if (result) {
      return NextResponse.json({ success: true, message: "SMS sent" });
    } else {
      return NextResponse.json(
        { success: false, error: "Failed to send SMS. Check your server logs for Twilio errors." },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 }
    );
  }
}