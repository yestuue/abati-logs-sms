"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet, Plus,
  Loader2, TrendingDown, TrendingUp,
  RefreshCw, CreditCard, ArrowUpRight, ArrowDownLeft
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

import { useSession } from "next-auth/react";

function formatCurrency(n: number) {
  const abs = Math.abs(n);
  return `₦${abs.toLocaleString()}`;
}

const TYPE_LABELS: Record<string, string> = {
  WALLET_TOPUP: "Wallet Top-up",
  NUMBER_PURCHASE: "Number Purchase",
  NUMBER_RENEWAL: "Number Renewal",
  ADMIN_ADJUST: "Admin Adjustment",
  ADMIN_CREDIT: "Admin Credit",
  REFUND: "Refund",
  REFERRAL_REWARD: "Referral reward",
  REFERRAL_WELCOME_BONUS: "Referral welcome bonus",
};

// ── Fund Wallet Modal ─────────────────────────────────────────────────────────
function FundWalletModal({ onClose }: { onClose: () => void }) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [fundLegalAccepted, setFundLegalAccepted] = useState(false);
  const quickAmounts = [500, 1000, 2000, 5000, 10000];

  function handleClose() {
    setFundLegalAccepted(false);
    onClose();
  }

  async function handlePay() {
    const amt = parseFloat(amount);
    if (!amt || amt < 100) { toast.error("Minimum is ₦100"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt, type: "WALLET_TOPUP" }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        toast.error(data.error ?? "Payment failed");
        return;
      }
      window.location.href = data.url;
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" style={{ color: "var(--primary)" }} />
            Fund Wallet
          </DialogTitle>
          <DialogDescription>Card and USSD payments via Flutterwave</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block text-xs text-muted-foreground">Quick Amount</Label>
            <div className="grid grid-cols-5 gap-2">
              {quickAmounts.map((q) => (
                <button
                  key={q}
                  onClick={() => setAmount(q.toString())}
                  className="py-1.5 rounded-lg text-xs font-semibold border transition-all"
                  style={
                    amount === q.toString()
                      ? { background: "oklch(0.68 0.22 278 / 0.18)", borderColor: "oklch(0.68 0.22 278 / 0.50)", color: "var(--primary)" }
                      : { background: "transparent", borderColor: "var(--border)", color: "var(--muted-foreground)" }
                  }
                >
                  ₦{q >= 1000 ? `${q / 1000}k` : q}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pay-amount">Custom Amount (₦)</Label>
            <Input
              id="pay-amount"
              type="number"
              min="100"
              placeholder="e.g. 3000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border bg-muted/40 p-3 text-xs leading-snug text-muted-foreground">
            <input
              type="checkbox"
              className="mt-0.5 size-4 shrink-0 rounded border-input accent-primary"
              checked={fundLegalAccepted}
              onChange={(e) => setFundLegalAccepted(e.target.checked)}
            />
            <span>
              I agree to the{" "}
              <Link href="/terms" className="font-medium text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                Terms &amp; Conditions
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="font-medium text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          <Button
            className="w-full font-semibold"
            style={{ background: "linear-gradient(135deg, oklch(0.68 0.22 278), oklch(0.55 0.24 278))", color: "#fff" }}
            onClick={handlePay}
            disabled={loading || !amount || !fundLegalAccepted}
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting…</> : `Pay ₦${amount ? parseFloat(amount).toLocaleString() : ""}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function WalletPage() {
  const { data: session, status } = useSession();
  const [showFundWallet, setShowFundWallet] = useState(false);
  const [walletData, setWalletData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function fetchWallet() {
    try {
      const res = await fetch("/api/user/wallet");
      if (res.ok) {
        const data = await res.json();
        setWalletData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === "authenticated") {
      fetchWallet();
    }
  }, [status]);

  if (status === "loading" || (loading && !walletData)) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const balance = walletData?.balance ?? 0;
  const transactions = walletData?.transactions ?? [];
  const totalSpent = walletData?.stats?.totalSpent ?? 0;
  const totalFunded = walletData?.stats?.totalFunded ?? 0;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-extrabold text-foreground"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Wallet
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your balance and funding options
        </p>
      </div>

      {/* Balance card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card
          className="relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, oklch(0.16 0.06 278), oklch(0.10 0.04 278))",
            border: "1px solid oklch(0.68 0.22 278 / 0.30)",
          }}
        >
          <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full pointer-events-none" style={{ background: "oklch(0.68 0.22 278 / 0.10)" }} />
          <CardContent className="p-6 relative">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg" style={{ background: "oklch(0.68 0.22 278 / 0.20)" }}>
                    <Wallet className="w-4 h-4" style={{ color: "oklch(0.82 0.18 278)" }} />
                  </div>
                  <span className="text-sm font-medium" style={{ color: "oklch(0.78 0.15 278)" }}>
                    Wallet Balance
                  </span>
                </div>
                <p className="text-4xl font-extrabold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                  ₦{balance.toLocaleString()}
                </p>
                <p className="text-xs mt-1.5" style={{ color: "oklch(0.68 0.12 278)" }}>
                  NGN · Available for services
                </p>
              </div>
              <button 
                onClick={() => {
                  setLoading(true);
                  fetchWallet();
                }}
                className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="mt-6 flex gap-3 flex-wrap">
              <Button
                size="sm"
                className="font-semibold"
                style={{
                  background: "linear-gradient(135deg, oklch(0.68 0.22 278), oklch(0.55 0.24 278))",
                  color: "#fff",
                  boxShadow: "0 4px 14px oklch(0.68 0.22 278 / 0.40)",
                }}
                onClick={() => setShowFundWallet(true)}
              >
                <Plus className="w-4 h-4" />
                Fund via Card
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Mini stats */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Total Funded", value: `₦${totalFunded.toLocaleString()}`, icon: TrendingUp, color: "oklch(0.62 0.18 150)" },
          { label: "Total Spent",  value: `₦${totalSpent.toLocaleString()}`,  icon: TrendingDown, color: "oklch(0.60 0.20 340)" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} style={{ border: "1px solid var(--border)" }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-xl font-extrabold mt-1" style={{ color, fontFamily: "var(--font-heading)" }}>
                    {value}
                  </p>
                </div>
                <div className="p-2 rounded-xl" style={{ background: `${color}18` }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent transactions */}
      <Card style={{ border: "1px solid var(--border)" }}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recent Transactions</CardTitle>
            <Link href="/dashboard/transactions" className="text-xs" style={{ color: "var(--primary)" }}>
              View all →
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/40">
            {transactions.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No transactions found
              </div>
            ) : (
              transactions.map((tx: any) => {
                const isCredit = [
                  "WALLET_TOPUP", "ADMIN_CREDIT", "ADMIN_ADJUST", "REFUND",
                  "REFERRAL_WELCOME_BONUS", "REFERRAL_REWARD"
                ].includes(tx.type);
                
                return (
                  <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                    <div
                      className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
                      style={{
                        background: isCredit
                          ? "oklch(0.62 0.18 150 / 0.14)"
                          : "oklch(0.60 0.20 340 / 0.14)",
                      }}
                    >
                      {isCredit
                        ? <TrendingUp className="w-4 h-4" style={{ color: "oklch(0.62 0.18 150)" }} />
                        : <TrendingDown className="w-4 h-4" style={{ color: "oklch(0.60 0.20 340)" }} />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{TYPE_LABELS[tx.type] ?? tx.type}</p>
                      <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p
                        className="text-sm font-bold"
                        style={{
                          color: isCredit
                            ? "oklch(0.62 0.18 150)"
                            : "var(--foreground)",
                        }}
                      >
                        {isCredit ? "+" : "-"}{formatCurrency(tx.amount)}
                      </p>
                      <Badge 
                        variant={tx.status === "SUCCESS" ? "success" : tx.status === "FAILED" ? "destructive" : "secondary"}
                        className="text-[10px] h-4 px-1"
                      >
                        {tx.status}
                      </Badge>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      {showFundWallet && <FundWalletModal onClose={() => setShowFundWallet(false)} />}
    </div>
  );
}

