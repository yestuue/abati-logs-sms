import { FiveSimProvider } from "./fivesim";
import { TwilioProvider } from "./twilio";
import { SmsProvider } from "./types";

export function getProvider(server: string): SmsProvider {
  // SERVER1 is Twilio, SERVER2 is 5sim
  if (server === "SERVER1") {
    return TwilioProvider;
  }
  return FiveSimProvider;
}

export * from "./types";
export { FiveSimProvider, TwilioProvider };
