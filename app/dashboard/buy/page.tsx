import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ServerSelector } from "@/components/purchase/server-selector";

export const metadata = { title: "Buy Number" };

export default async function BuyPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  let walletBalance = 0;
  let walletCurrency: "NGN" | "USD" = "NGN";
  let serverConfigs: { server: "SERVER1" | "SERVER2"; name: string; isEnabled: boolean }[] = [
    { server: "SERVER1", name: "Server 1 — USA Numbers", isEnabled: true },
    { server: "SERVER2", name: "Server 2 — Global Numbers", isEnabled: true },
  ];

  try {
    const [user, configs] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { walletBalance: true, walletCurrency: true },
      }),
      prisma.serverConfig.findMany({ orderBy: { server: "asc" } }),
    ]);

    if (user) {
      walletBalance = user.walletBalance;
      walletCurrency = user.walletCurrency as "NGN" | "USD";
    }

    if (configs.length > 0) {
      serverConfigs = configs as typeof serverConfigs;
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
      />
    </div>
  );
}
