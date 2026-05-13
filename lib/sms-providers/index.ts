import { TwilioProvider } from "./twilio";
import { SmsProvider } from "./types";

export async function getActiveProvider(server: string): Promise<SmsProvider> {
  // We are now only using Twilio
  return TwilioProvider;
}

/** Synchronous version for compatibility */
export function getProvider(server: string): SmsProvider {
  return TwilioProvider;
}

export * from "./types";
export { TwilioProvider };
