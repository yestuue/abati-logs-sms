import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

// Initialize the Twilio client safely
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

/**
 * Sends an SMS (Welcome or OTP) using Twilio.
 * @param to The recipient's phone number
 * @param message The SMS message to send
 */
export async function sendSMS(to: string, message: string) {
  if (!client) {
    console.error("[Twilio Error] Client not initialized. Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN in Vercel.");
    return null;
  }

  try {
    const response = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER || "Abati", // Defaults to 'Abati' branding if a number isn't explicitly mandated
      to,
    });
    console.log(`[Twilio] SMS successfully sent to ${to}. SID: ${response.sid}`);
    return response;
  } catch (error) {
    console.error("[Twilio Error] Failed to send SMS to", to, "Details:", error);
    return null; // Return null instead of throwing to prevent application crashes
  }
}