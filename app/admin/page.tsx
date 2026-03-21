import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Phone,
  MessageSquare,
  DollarSign,
  Activity,
  Server,
  TrendingUp,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Admin — Overview" };

export default async function AdminPage() {
  const [
    totalUsers,
    totalNumbers,
    assignedNumbers,
    totalSms,
    revenue,
    recentUsers,
    serverConfigs,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.virtualNumber.count(),
    prisma.virtualNumber.count({ where: { status: "ASSIGNED" } }),
    prisma.sMS.count(),
    prisma.transaction.aggregate({
      where: { status: "SUCCESS" },
      _sum: { amount: true },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    prisma.serverConfig.findMany({ orderBy: { server: "asc" } }),
  ]);

  const totalRevenue = revenue._sum.amount ?? 0;

  const stats = [
    {
      label: "Total Users",
      value: totalUsers.toString(),
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Total Numbers",
      value: totalNumbers.toString(),
      icon: Phone,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      sub: `${assignedNumbers} assigned`,
    },
    {
      label: "SMS Processed",
      value: totalSms.toString(),
      icon: MessageSquare,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      label: "Total Revenue",
      value: formatCurrency(totalRevenue, "NGN"),
      icon: DollarSign,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Overview</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Platform-wide statistics and health
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="hover:scale-[1.02] transition-transform">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-xl font-bold text-foreground mt-1">
                      {s.value}
                    </p>
                    {s.sub && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {s.sub}
                      </p>
                    )}
                  </div>
                  <div className={`p-2 rounded-xl ${s.bg}`}>
                    <Icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Server status */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Server Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {serverConfigs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No server configs found. Visit the Servers page to configure.
              </p>
            ) : (
              serverConfigs.map((cfg) => (
                <div
                  key={cfg.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/30"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        cfg.isEnabled ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground"
                      }`}
                    />
                    <span className="text-sm font-medium">{cfg.name}</span>
                  </div>
                  <Badge variant={cfg.isEnabled ? "success" : "secondary"}>
                    {cfg.isEnabled ? "Online" : "Offline"}
                  </Badge>
                </div>
              ))
            )}
            <a
              href="/admin/servers"
              className="text-xs text-primary hover:underline block text-right"
            >
              Manage Servers →
            </a>
          </CardContent>
        </Card>

        {/* Recent users */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Recent Users</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/30">
              {recentUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-accent/20"
                >
                  <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-primary">
                      {(u.name ?? u.email)[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <Badge
                    variant={u.role === "ADMIN" ? "warning" : "secondary"}
                    className="text-[10px]"
                  >
                    {u.role}
                  </Badge>
                </div>
              ))}
            </div>
            <div className="px-4 py-2 border-t border-border/30">
              <a href="/admin/users" className="text-xs text-primary hover:underline">
                View all users →
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
