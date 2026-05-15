import { TwilioProvider } from "./twilio";
import { SmsProvider } from "./types";

/** 
 * Returns the active SMS provider. 
 * Only Twilio is currently supported and used for all servers.
 */
export async function getActiveProvider(server: string): Promise<SmsProvider> {
  return TwilioProvider;
}

/** Synchronous version for compatibility */
export function getProvider(server: string): SmsProvider {
  return TwilioProvider;
}

export * from "./types";
export { TwilioProvider };
