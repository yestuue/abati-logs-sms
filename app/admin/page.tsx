import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, Phone, MessageSquare, DollarSign,
  Activity, Server, TrendingUp, ArrowUpRight,
  ShoppingCart, Wallet, UserPlus, Clock,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

export const metadata = { title: "Admin — Overview" };

const TYPE_ICONS: Record<string, React.ElementType> = {
  WALLET_TOPUP:    Wallet,
  NUMBER_PURCHASE: ShoppingCart,
  NUMBER_RENEWAL:  ArrowUpRight,
  ADMIN_ADJUST:    Activity,
  ADMIN_CREDIT:    TrendingUp,
};

export default async function AdminPage() {
  const [
    totalUsers,
    totalNumbers,
    assignedNumbers,
    availableNumbers,
    totalSms,
    unreadSms,
    revenue,
    recentUsers,
    serverConfigs,
    recentTransactions,
    todayRevenue,
    monthRevenue,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.virtualNumber.count(),
    prisma.virtualNumber.count({ where: { status: "ASSIGNED" } }),
    prisma.virtualNumber.count({ where: { status: "AVAILABLE" } }),
    prisma.sMS.count(),
    prisma.sMS.count({ where: { read: false } }),
    prisma.transaction.aggregate({
      where: { status: "SUCCESS" },
      _sum: { amount: true },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, role: true, createdAt: true, walletBalance: true, walletCurrency: true },
    }),
    prisma.serverConfig.findMany({ orderBy: { server: "asc" } }),
    prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true, amount: true, currency: true, type: true,
        status: true, createdAt: true,
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.transaction.aggregate({
      where: {
        status: "SUCCESS",
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        status: "SUCCESS",
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      _sum: { amount: true },
    }),
  ]);

  const totalRevenue = revenue._sum.amount ?? 0;

  const stats = [
    {
      label: "Total Users",
      value: totalUsers.toLocaleString(),
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      href: "/admin/users",
    },
    {
      label: "Numbers",
      value: totalNumbers.toLocaleString(),
      sub: `${availableNumbers} available · ${assignedNumbers} assigned`,
      icon: Phone,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      href: "/admin/numbers",
    },
    {
      label: "SMS Processed",
      value: totalSms.toLocaleString(),
      sub: `${unreadSms} unread`,
      icon: MessageSquare,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
      href: "/admin/numbers",
    },
    {
      label: "Total Revenue",
      value: formatCurrency(totalRevenue, "NGN"),
      sub: `Today: ${formatCurrency(todayRevenue._sum.amount ?? 0, "NGN")}`,
      icon: DollarSign,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      href: "/admin/revenue",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Platform health &amp; live activity
          </p>
        </div>
        <div
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium"
          style={{ background: "rgba(0,229,160,0.08)", border: "1px solid rgba(0,229,160,0.20)", color: "var(--primary)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          Live Dashboard
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} href={s.href}>
              <Card className="hover:scale-[1.02] transition-transform cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                      <p className="text-xl font-bold text-foreground mt-1 leading-none">{s.value}</p>
                      {s.sub && (
                        <p className="text-[10px] text-muted-foreground mt-1">{s.sub}</p>
                      )}
                    </div>
                    <div className={`p-2 rounded-xl ${s.bg} flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${s.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Revenue this month banner */}
      <Card
        className="overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(0,229,160,0.08) 0%, rgba(0,229,160,0.04) 100%)", border: "1px solid rgba(0,229,160,0.20)" }}
      >
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Revenue — Last 30 Days</p>
              <p className="text-3xl font-bold mt-1" style={{ color: "var(--primary)", fontFamily: "var(--font-heading)" }}>
                {formatCurrency(monthRevenue._sum.amount ?? 0, "NGN")}
              </p>
            </div>
            <Link
              href="/admin/revenue"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
              style={{ background: "rgba(0,229,160,0.15)", color: "var(--primary)" }}
            >
              <TrendingUp className="w-4 h-4" />
              View Analytics
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Server status */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">Server Status</CardTitle>
              </div>
              <Link href="/admin/servers" className="text-xs text-primary hover:underline">
                Manage →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {serverConfigs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No server configs found.</p>
            ) : (
              serverConfigs.map((cfg) => (
                <div
                  key={cfg.id}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        cfg.isEnabled ? "bg-emerald-400 animate-pulse" : "bg-gray-400"
                      }`}
                    />
                    <div>
                      <span className="text-sm font-medium">{cfg.name}</span>
                      <p className="text-xs text-muted-foreground">
                        {cfg.server === "SERVER1" ? "USA (+1) numbers" : "Global 50+ countries"}
                      </p>
                    </div>
                  </div>
                  <Badge variant={cfg.isEnabled ? "success" : "secondary"}>
                    {cfg.isEnabled ? "Online" : "Offline"}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent users */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">Recent Signups</CardTitle>
              </div>
              <Link href="/admin/users" className="text-xs text-primary hover:underline">
                View all →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/30">
              {recentUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-accent/20 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">
                      {(u.name ?? u.email)[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-semibold text-primary">
                      {formatCurrency(u.walletBalance, u.walletCurrency as "NGN" | "USD")}
                    </p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end mt-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {formatDate(u.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent transactions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Recent Transactions</CardTitle>
            </div>
            <Link href="/admin/revenue" className="text-xs text-primary hover:underline">
              Full report →
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/30">
            {recentTransactions.map((tx) => {
              const Icon = TYPE_ICONS[tx.type] ?? Activity;
              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-accent/20 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {tx.user?.name ?? tx.user?.email ?? "Unknown user"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tx.type.replace(/_/g, " ")} · {formatDate(tx.createdAt)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold">
                      {formatCurrency(tx.amount, (tx.currency ?? "NGN") as "NGN" | "USD")}
                    </p>
                    <Badge
                      variant={
                        tx.status === "SUCCESS" ? "success"
                        : tx.status === "FAILED" ? "destructive"
                        : "warning"
                      }
                      className="text-[10px]"
                    >
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
            {recentTransactions.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">No transactions yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
