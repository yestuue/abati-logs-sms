import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CreditCard, ArrowUpRight, ArrowDownLeft, TrendingUp } from "lucide-react";

export const metadata = { title: "Transactions" };

const TYPE_LABELS: Record<string, string> = {
  WALLET_TOPUP:   "Wallet Top-up",
  NUMBER_PURCHASE:"Number Purchase",
  NUMBER_RENEWAL: "Number Renewal",
  ADMIN_ADJUST:   "Admin Adjustment",
  ADMIN_CREDIT:   "Admin Credit",
  REFERRAL_REWARD: "Referral reward",
};

export default async function TransactionsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const transactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const totalSpent = transactions
    .filter((t) => t.status === "SUCCESS" && t.type === "NUMBER_PURCHASE")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalTopups = transactions
    .filter((t) => t.status === "SUCCESS" && t.type === "WALLET_TOPUP")
    .reduce((sum, t) => sum + t.amount, 0);

  const currency = (session!.user.walletCurrency ?? "NGN") as "NGN" | "USD";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Your complete payment and purchase history
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Transactions</p>
                <p className="text-2xl font-bold mt-1">{transactions.length}</p>
              </div>
              <div className="p-2 rounded-xl bg-primary/10">
                <CreditCard className="w-4 h-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Funded</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(totalTopups, currency)}</p>
              </div>
              <div className="p-2 rounded-xl bg-emerald-500/10">
                <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Spent</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(totalSpent, currency)}</p>
              </div>
              <div className="p-2 rounded-xl bg-amber-500/10">
                <ArrowUpRight className="w-4 h-4 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction list */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">All Transactions</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No transactions yet</p>
              <p className="text-xs mt-1">Top up your wallet to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {transactions.map((tx) => {
                const isTopup = tx.type === "WALLET_TOPUP" || tx.type === "ADMIN_CREDIT" || tx.type === "ADMIN_ADJUST";
                return (
                  <div key={tx.id} className="flex items-center gap-3 px-4 py-3 hover:bg-accent/20 transition-colors">
                    {/* Icon */}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isTopup ? "bg-emerald-500/10" : "bg-amber-500/10"
                      }`}
                    >
                      {isTopup ? (
                        <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-amber-500" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {TYPE_LABELS[tx.type] ?? tx.type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(tx.createdAt)}
                        {tx.reference && (
                          <span className="ml-2 font-mono text-[10px] opacity-60">
                            #{tx.reference.slice(-8)}
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Amount + Status */}
                    <div className="text-right flex-shrink-0">
                      <p
                        className={`text-sm font-bold ${
                          isTopup ? "text-emerald-600" : "text-foreground"
                        }`}
                      >
                        {isTopup ? "+" : "-"}
                        {formatCurrency(tx.amount, (tx.currency ?? currency) as "NGN" | "USD")}
                      </p>
                      <Badge
                        variant={
                          tx.status === "SUCCESS"
                            ? "success"
                            : tx.status === "FAILED"
                            ? "destructive"
                            : tx.status === "REVERSED"
                            ? "warning"
                            : "secondary"
                        }
                        className="text-[10px] mt-0.5"
                      >
                        {tx.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
