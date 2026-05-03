import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ServerSelector } from "@/components/purchase/server-selector";

export const metadata = { title: "Buy Number" };

export default async function BuyPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  let s1Margin = 35;
  let s2Margin = 35;

  try {
    const [user, configs, settings] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { walletBalance: true, walletCurrency: true },
      }),
      prisma.serverConfig.findMany({ orderBy: { server: "asc" } }),
      prisma.globalSettings.findFirst({ orderBy: { updatedAt: "desc" } }),
    ]);

    if (user) {
      walletBalance = user.walletBalance;
      walletCurrency = user.walletCurrency as "NGN" | "USD";
    }

    if (configs.length > 0) {
      serverConfigs = configs as typeof serverConfigs;
    }

    if (settings) {
      s1Margin = settings.s1Margin ?? (settings.smsGlobalPremiumRate != null ? settings.smsGlobalPremiumRate * 100 : 35);
      s2Margin = settings.s2Margin ?? (settings.smsGlobalPremiumRateServer2 != null ? settings.smsGlobalPremiumRateServer2 * 100 : 35);
    }
  } catch (err) {
    console.error("[BuyPage] DB error:", err);
    // Fall through with defaults — page still renders
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Buy a Number</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Choose a server and select your virtual number to start receiving OTPs
        </p>
      </div>

      <ServerSelector
        walletBalance={walletBalance}
        walletCurrency={walletCurrency}
        serverConfigs={serverConfigs}
        userId={userId}
        s1Margin={s1Margin}
        s2Margin={s2Margin}
      />
    </div>
  );
}
