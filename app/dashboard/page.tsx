import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { WalletCard } from "@/components/dashboard/wallet-card";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ActiveNumbers } from "@/components/dashboard/active-numbers";
import { SmsInbox } from "@/components/dashboard/sms-inbox";
import { MessageCircle, Users } from "lucide-react";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const firstName = session.user.name?.split(" ")[0] ?? "there";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let user: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let numbers: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let recentSms: any[] = [];
  let txCount = 0;

  try {
    [user, numbers, recentSms, txCount] = await Promise.all([
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
  } catch (err) {
    console.error("[DashboardPage] DB error:", err);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {firstName} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Here&apos;s what&apos;s happening with your account
        </p>
      </div>

      <StatsCards
        walletBalance={user?.walletBalance ?? 0}
        walletCurrency={(user?.walletCurrency ?? "NGN") as "NGN" | "USD"}
        activeNumbers={numbers.length}
        smsReceived={recentSms.length}
        totalTransactions={txCount}
      />

      <WalletCard
        balance={user?.walletBalance ?? 0}
        currency={(user?.walletCurrency ?? "NGN") as "NGN" | "USD"}
        userId={userId}
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ActiveNumbers numbers={numbers} />
        <SmsInbox messages={recentSms} />
      </div>

      <div
        className="rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ background: "#ffffff", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
      >
        <div>
          <p className="font-semibold text-sm" style={{ color: "#111827" }}>Need help?</p>
          <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>
            Our support team is available 24/7. Join the community or chat with us directly.
          </p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <a
            href="https://chat.whatsapp.com/H3gMVzCwe5sFDYFb0HoKGL"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-85"
            style={{ background: "#00E5A0", color: "#09090d" }}
          >
            <Users className="w-4 h-4" />
            WhatsApp Group
          </a>
          <a
            href="https://api.whatsapp.com/send?phone=2349049386397"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-85"
            style={{ background: "#00E5A0", color: "#09090d" }}
          >
            <MessageCircle className="w-4 h-4" />
            Chat with Us
          </a>
        </div>
      </div>
    </div>
  );
}
