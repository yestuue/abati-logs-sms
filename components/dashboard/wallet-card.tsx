"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Wallet, Plus, ArrowUpRight, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface WalletCardProps {
  balance: number;
  currency: "NGN" | "USD";
  userId: string;
}

export function WalletCard({ balance, currency, userId }: WalletCardProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleTopup() {
    const amt = parseFloat(amount);
    if (!amt || amt < 100) {
      toast.error("Minimum top-up is ₦100");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt, type: "WALLET_TOPUP" }),
      });
      const data = await res.json();

      if (!res.ok || !data.url) {
        toast.error(data.error ?? "Failed to initialize payment");
        return;
      }

      // Redirect to Paystack
      window.location.href = data.url;
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const quickAmounts = [500, 1000, 2000, 5000];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-gradient-to-br from-brand-900/60 to-brand-950/80 border-brand-700/30 glow-brand">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-brand-500/20">
                    <Wallet className="w-4 h-4 text-brand-400" />
                  </div>
                  <span className="text-sm text-brand-300 font-medium">
                    Wallet Balance
                  </span>
                </div>
                <p className="text-3xl font-bold text-white tracking-tight">
                  {formatCurrency(balance, currency)}
                </p>
                <p className="text-xs text-brand-400 mt-1">
                  {currency} • Available for purchases
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-brand-600/40 text-brand-300 hover:bg-brand-800/40"
                onClick={() => router.refresh()}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                variant="brand"
                size="sm"
                className="flex-1"
                onClick={() => setOpen(true)}
              >
                <Plus className="w-4 h-4" />
                Top Up Wallet
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-brand-600/40 text-brand-300 hover:bg-brand-800/40"
                asChild
              >
                <a href="/dashboard/buy">
                  <ArrowUpRight className="w-4 h-4" />
                  Buy Number
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Top-up Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Top Up Wallet</DialogTitle>
            <DialogDescription>
              Add funds via Paystack (card, bank transfer, USSD)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Quick amounts */}
            <div>
              <Label className="mb-2 block">Quick Amount (₦)</Label>
              <div className="grid grid-cols-4 gap-2">
                {quickAmounts.map((q) => (
                  <button
                    key={q}
                    onClick={() => setAmount(q.toString())}
                    className={`py-2 rounded-xl text-sm font-medium border transition-all ${
                      amount === q.toString()
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border/50 text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    ₦{q.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="amount">Custom Amount (₦)</Label>
              <Input
                id="amount"
                type="number"
                min="100"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <Button
              variant="brand"
              className="w-full"
              onClick={handleTopup}
              disabled={loading || !amount}
            >
              {loading ? "Redirecting…" : `Pay ${amount ? `₦${parseFloat(amount).toLocaleString()}` : ""}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
