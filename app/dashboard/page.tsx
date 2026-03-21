import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WalletCard } from "@/components/dashboard/wallet-card";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ActiveNumbers } from "@/components/dashboard/active-numbers";
import { SmsInbox } from "@/components/dashboard/sms-inbox";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [user, numbers, recentSms, txCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true, walletCurrency: true, createdAt: true },
    }),
    prisma.virtualNumber.findMany({
      where: { userId },
      orderBy: { assignedAt: "desc" },
      take: 10,
    }),
    prisma.sMS.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { number: { select: { number: true } } },
    }),
    prisma.transaction.count({ where: { userId, status: "SUCCESS" } }),
  ]);

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {session!.user.name.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Here&apos;s what&apos;s happening with your account
        </p>
      </div>

      {/* Stats row */}
      <StatsCards
        walletBalance={user?.walletBalance ?? 0}
        walletCurrency={(user?.walletCurrency ?? "NGN") as "NGN" | "USD"}
        activeNumbers={numbers.length}
        smsReceived={recentSms.length}
        totalTransactions={txCount}
      />

      {/* Wallet card */}
      <WalletCard
        balance={user?.walletBalance ?? 0}
        currency={(user?.walletCurrency ?? "NGN") as "NGN" | "USD"}
        userId={userId}
      />

      {/* Active numbers + SMS split */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ActiveNumbers numbers={numbers} />
        <SmsInbox messages={recentSms} />
      </div>
    </div>
  );
}
