import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Users } from "lucide-react";

export const metadata = { title: "Admin — Numbers" };

export default async function AdminNumbersPage() {
  const numbers = await prisma.virtualNumber.findMany({
    orderBy: [{ server: "asc" }, { status: "asc" }],
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  const server1 = numbers.filter((n) => n.server === "SERVER1");
  const server2 = numbers.filter((n) => n.server === "SERVER2");

  const renderTable = (nums: typeof numbers, title: string, badge: string) => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          <Badge variant="secondary">{nums.length} numbers</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/30">
          {nums.map((n) => (
            <div key={n.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono font-semibold">{n.number}</p>
                <p className="text-xs text-muted-foreground">{n.country}</p>
              </div>
              <Badge
                variant={
                  n.status === "AVAILABLE"
                    ? "success"
                    : n.status === "ASSIGNED"
                    ? "info"
                    : "warning"
                }
                className="text-[10px]"
              >
                {n.status}
              </Badge>
              {n.user && (
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-medium truncate max-w-[120px]">
                    {n.user.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                    {n.user.email}
                  </p>
                </div>
              )}
            </div>
          ))}
          {nums.length === 0 && (
            <div className="text-center py-10 text-sm text-muted-foreground">
              No numbers in this server. Run the seed script to add numbers.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Number Pool</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          All virtual numbers across both servers
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {renderTable(server1, "Server 1 — USA Numbers 🇺🇸", "SERVER1")}
        {renderTable(server2, "Server 2 — Global Numbers 🌍", "SERVER2")}
      </div>
    </div>
  );
}
