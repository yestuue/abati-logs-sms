import { prisma } from "@/lib/prisma";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, Server } from "lucide-react";

export const metadata = { title: "Admin — Revenue" };

export default async function RevenuePage() {
  const [allTx, server1Rev, server2Rev, last30Days] = await Promise.all([
    prisma.transaction.aggregate({
      where: { status: "SUCCESS" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.transaction.aggregate({
      where: { status: "SUCCESS", server: "SERVER1" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.transaction.aggregate({
      where: { status: "SUCCESS", server: "SERVER2" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.transaction.findMany({
      where: {
        status: "SUCCESS",
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { createdAt: "asc" },
      select: { amount: true, server: true, createdAt: true, type: true },
    }),
  ]);

  // Group by day for chart
  const byDay: Record<string, { date: string; server1: number; server2: number; topup: number }> = {};
  for (const tx of last30Days) {
    const day = tx.createdAt.toISOString().split("T")[0];
    if (!byDay[day]) byDay[day] = { date: day, server1: 0, server2: 0, topup: 0 };
    if (tx.server === "SERVER1") byDay[day].server1 += tx.amount;
    else if (tx.server === "SERVER2") byDay[day].server2 += tx.amount;
    else byDay[day].topup += tx.amount;
  }

  const chartData = Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-4">Revenue Analytics</h1>
        <p className="text-muted-foreground leading-relaxed">
          Breakdown of earnings per server and transaction type
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Total Revenue",
            value: formatCurrency(allTx._sum.amount ?? 0, "NGN"),
            sub: `${allTx._count} transactions`,
            icon: DollarSign,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
          },
          {
            label: "Server 1 (USA)",
            value: formatCurrency(server1Rev._sum.amount ?? 0, "NGN"),
            sub: `${server1Rev._count} purchases`,
            icon: Server,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
          },
          {
            label: "Server 2 (Global)",
            value: formatCurrency(server2Rev._sum.amount ?? 0, "NGN"),
            sub: `${server2Rev._count} purchases`,
            icon: TrendingUp,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold mt-1">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>
                </div>
                <div className={`p-2 rounded-xl ${s.bg}`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <RevenueChart data={chartData} />
    </div>
  );
}
