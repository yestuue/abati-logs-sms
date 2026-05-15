import { TwilioProvider } from "./twilio";
import { GrizzlyProvider } from "./grizzly";
import { SmsProvider } from "./types";
import { prisma } from "../prisma";

export async function getActiveProvider(server: string): Promise<SmsProvider> {
  const settings = await prisma.globalSettings.findFirst({
    orderBy: { updatedAt: "desc" },
    select: { smsProvider: true }
  });

  const providerType = settings?.smsProvider || "FIVESIM";

  // Server 1 is hardcoded to Twilio for USA optimization
  if (server === "SERVER1") return TwilioProvider;

  // Server 2 uses the configured provider
  if (providerType === "GRIZZLY") return GrizzlyProvider;
  
  // Default to Twilio if not specified or for 5sim (if 5sim not yet implemented as separate file)
  // [Note: Add 5sim provider here once implemented]
  return TwilioProvider;
}

/** Synchronous version for compatibility */
export function getProvider(server: string): SmsProvider {
  // Can't do async prisma here, so we return Twilio by default
  // Ideally, the caller should use getActiveProvider
  if (server === "SERVER1") return TwilioProvider;
  return TwilioProvider;
}

export * from "./types";
export { TwilioProvider, GrizzlyProvider };
