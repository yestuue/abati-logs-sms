import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { WalletCard } from "@/components/dashboard/wallet-card";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ActiveNumbers } from "@/components/dashboard/active-numbers";
import { SmsInbox } from "@/components/dashboard/sms-inbox";
import {
  MessageCircle, Users, ShoppingCart, Globe,
  History, ShoppingBag, Wallet, ArrowRight, Gift,
} from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Dashboard" };

const quickLinks = [
  { label: "USA Numbers",   desc: "Buy US virtual numbers",     href: "/dashboard/buy",    icon: ShoppingCart, color: "oklch(0.80 0.19 162)" },
  { label: "All Countries", desc: "50+ global countries",       href: "/dashboard/buy",    icon: Globe,        color: "oklch(0.70 0.17 200)" },
  { label: "Social Logs",   desc: "Account marketplace",        href: "/dashboard/social", icon: ShoppingBag,  color: "oklch(0.72 0.18 300)" },
  { label: "Wallet",        desc: "Fund & manage balance",      href: "/dashboard/wallet", icon: Wallet,       color: "oklch(0.80 0.15 80)"  },
  { label: "History",       desc: "View all transactions",      href: "/dashboard/transactions", icon: History, color: "oklch(0.72 0.16 162)" },
  { label: "Referrals",     desc: "Invite friends & earn",      href: "/referrals",                icon: Gift,    color: "oklch(0.72 0.20 300)" },
];

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
  let totalSpent = 0;

  try {
    const [_user, _numbers, _recentSms, _txCount, spentAgg] = await Promise.all([
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
      prisma.transaction.aggregate({
        where: { userId, status: "SUCCESS", amount: { gt: 0 } },
        _sum: { amount: true },
      }),
    ]);
    user = _user;
    numbers = _numbers;
    recentSms = _recentSms;
    txCount = _txCount;
    totalSpent = spentAgg._sum.amount ?? 0;
  } catch (err) {
    console.error("[DashboardPage] DB error:", err);
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1
          className="text-2xl font-extrabold text-foreground"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Welcome back, {firstName} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Here&apos;s a snapshot of your Abati Logs account
        </p>
      </div>

      {/* 3-Card Stats */}
      <StatsCards
        walletBalance={user?.walletBalance ?? 0}
        walletCurrency={(user?.walletCurrency ?? "NGN") as "NGN" | "USD"}
        activeNumbers={numbers.length}
        smsReceived={recentSms.length}
        totalTransactions={txCount}
        totalSpent={totalSpent}
      />

      {/* Wallet Card */}
      <WalletCard
        balance={user?.walletBalance ?? 0}
        currency={(user?.walletCurrency ?? "NGN") as "NGN" | "USD"}
        userId={userId}
      />

      {/* Quick Access Grid */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Quick Access
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                className="group flex items-center gap-4 p-4 rounded-2xl border transition-all hover:scale-[1.01]"
                style={{
                  background: "var(--card)",
                  borderColor: "var(--border)",
                }}
              >
                <div
                  className="p-2.5 rounded-xl flex-shrink-0"
                  style={{ background: `${item.color}18` }}
                >
                  <Icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
                </div>
                <ArrowRight
                  className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
                />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Active Numbers + SMS Inbox */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ActiveNumbers numbers={numbers} />
        <SmsInbox messages={recentSms} />
      </div>

      {/* Support Banner */}
      <div
        className="rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{
          background: "linear-gradient(135deg, oklch(0.68 0.22 278 / 0.10), oklch(0.55 0.24 278 / 0.06))",
          border: "1px solid oklch(0.68 0.22 278 / 0.22)",
        }}
      >
        <div>
          <p className="font-semibold text-sm text-foreground">Need help?</p>
          <p className="text-xs mt-0.5 text-muted-foreground">
            Our support team is available 24/7 — join the community or chat directly.
          </p>
        </div>
        <div className="flex gap-3 flex-shrink-0 flex-wrap">
          <a
            href="https://chat.whatsapp.com/H3gMVzCwe5sFDYFb0HoKGL"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-85"
            style={{
              background: "linear-gradient(135deg, oklch(0.68 0.22 278), oklch(0.55 0.24 278))",
              color: "#fff",
            }}
          >
            <Users className="w-4 h-4" />
            WhatsApp Group
          </a>
          <a
            href="https://api.whatsapp.com/send?phone=2349049386397"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-85"
            style={{
              background: "var(--accent)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
            }}
          >
            <MessageCircle className="w-4 h-4" />
            Chat with Us
          </a>
        </div>
      </div>
    </div>
  );
}
