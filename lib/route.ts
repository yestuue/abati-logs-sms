import { NextResponse } from "next/server";
import { sendSMS } from "@/lib/sms";

export async function GET() {
  // Replace with your actual phone number, including the country code (e.g., +1234567890)
  const testPhoneNumber = "+1234567890"; 
  const message = "Hello from Abati!";

  try {
    const result = await sendSMS(testPhoneNumber, message);

    if (result) {
      return NextResponse.json({ success: true, message: "SMS sent successfully!", data: result });
    } else {
      return NextResponse.json(
        { success: false, error: "Failed to send SMS. Check your server console for Twilio errors." },
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