/**
 * Sends an SMS (Welcome or OTP) using Termii.
 * @param to The recipient's phone number
 * @param message The SMS message to send
 * @param fromNumber Optional specific from number
 */
export async function sendSMS(to: string, message: string, fromNumber?: string) {
  const apiKey = process.env.TERMII_API_KEY;

  if (!apiKey) {
    console.error("[Termii Error] Client not initialized. Missing TERMII_API_KEY in Vercel.");
    return null;
  }

  try {
    const response = await fetch("https://api.ng.termii.com/api/sms/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to,
        from: fromNumber || process.env.TERMII_SENDER_ID || "ABATI",
        sms: message,
        type: "plain",
        channel: "generic",
        api_key: apiKey,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[Termii Error] Failed to send SMS to", to, "Details:", data);
      throw new Error(data.message || "Termii API Error");
    }

    console.log(`[Termii] SMS successfully sent to ${to}. Message ID: ${data.message_id}`);
    return data;
  } catch (error) {
    console.error("[Termii Error] Failed to send SMS to", to, "Details:", error);
    throw error; // Throw the error so the test route can catch and display it
  }
}