export async function sendSMS(to: string, message: string) {
  const apiKey = process.env.TERMII_API_KEY;
  const senderId = process.env.TERMII_SENDER_ID;

  if (!apiKey) {
    throw new Error("Missing TERMII_API_KEY");
  }

  if (!senderId) {
    throw new Error("Missing TERMII_SENDER_ID");
  }

  const response = await fetch("https://api.ng.termii.com/api/sms/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: apiKey,
      to,
      from: senderId,
      sms: message,
      type: "plain",
      channel: "generic",
    }),
  });

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error("Termii API returned a non-JSON response");
  }

  if (!response.ok) {
    const errorMessage =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof (data as { message: unknown }).message === "string"
        ? (data as { message: string }).message
        : "Termii API request failed";
    throw new Error(errorMessage);
  }

  return data;
}