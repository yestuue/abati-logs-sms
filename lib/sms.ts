import twilio from "twilio";

// Initialize the Twilio client safely
const client = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN 
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN) 
  : null;

/**
 * Sends an SMS (Welcome or OTP) using Twilio.
 * @param to The recipient's phone number
 * @param message The SMS message to send
 * @param fromNumber Optional specific from number
 */
export async function sendSMS(to: string, message: string, fromNumber?: string) {
  if (!client) {
    console.error("[Twilio Error] Client not initialized. Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN in Vercel.");
    return null;
  }

  try {
    const response = await client.messages.create({
      body: message,
      from: fromNumber || process.env.TWILIO_PHONE_NUMBER,
      to,
    });
    console.log(`[Twilio] SMS successfully sent to ${to}. SID: ${response.sid}`);
    return response;
  } catch (error) {
    console.error("[Twilio Error] Failed to send SMS to", to, "Details:", error);
    throw error; // Throw the error so the test route can catch and display it
  }
}