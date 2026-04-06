import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

// Initialize the Twilio client safely
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

/**
 * Sends an SMS (Welcome or OTP) using Twilio.
 * @param to The recipient's phone number
 * @param body The SMS message to send
 */
export async function sendSMS(to: string, body: string) {
  if (!client) {
    console.warn("[Twilio] Client not initialized. Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.");
    return;
  }

  try {
    const response = await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER || "Abati", // Defaults to 'Abati' branding if a number isn't explicitly mandated
      to,
    });
    console.log(`[Twilio] SMS successfully sent to ${to}. SID: ${response.sid}`);
    return response;
  } catch (error) {
    console.error("[Twilio] Failed to send SMS:", error);
    throw error;
  }
}