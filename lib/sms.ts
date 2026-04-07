export async function sendSMS(to: string, message: string) {
  const response = await fetch("https://api.ng.termii.com/api/sms/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: "tsk_EP9brYsIxZFKKDFjbintAq3gVj",
      to,
      from: "N-Alert",
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
    const fallback = "Termii API request failed";
    const errorMessage =
      typeof data === "object" && data !== null
        ? JSON.stringify(data)
        : fallback;
    throw new Error(errorMessage);
  }

  return data;
}