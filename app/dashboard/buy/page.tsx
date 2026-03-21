import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ServerSelector } from "@/components/purchase/server-selector";

export const metadata = { title: "Buy Number" };

export default async function BuyPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [user, serverConfigs] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true, walletCurrency: true },
    }),
    prisma.serverConfig.findMany({ orderBy: { server: "asc" } }),
  ]);

  // Seed server configs if they don't exist
  const configs = serverConfigs.length > 0 ? serverConfigs : [
    { server: "SERVER1", name: "Server 1 — USA Numbers", isEnabled: true },
    { server: "SERVER2", name: "Server 2 — Global Numbers", isEnabled: true },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Buy a Number</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Choose a server and select your virtual number to start receiving OTPs
        </p>
      </div>

      <ServerSelector
        walletBalance={user?.walletBalance ?? 0}
        walletCurrency={(user?.walletCurrency ?? "NGN") as "NGN" | "USD"}
        serverConfigs={configs as { server: "SERVER1" | "SERVER2"; name: string; isEnabled: boolean }[]}
        userId={userId}
      />
    </div>
  );
}
