"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Wallet, Plus, ArrowUpRight, RefreshCw, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface WalletCardProps {
  balance: number;
  currency: "NGN" | "USD";
  userId: string;
}

export function WalletCard({ balance, currency }: WalletCardProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [fundLegalAccepted, setFundLegalAccepted] = useState(false);

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
        transition={{ delay: 0.15 }}
      >
        <Card
          className="relative overflow-hidden glow-brand"
          style={{
            background: "linear-gradient(135deg, oklch(0.16 0.06 278), oklch(0.10 0.04 278))",
            border: "1px solid oklch(0.68 0.22 278 / 0.30)",
          }}
        >
          {/* Decorative orb */}
          <div
            className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: "oklch(0.68 0.22 278 / 0.12)" }}
          />
          <div
            className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full pointer-events-none"
            style={{ background: "oklch(0.68 0.22 278 / 0.08)" }}
          />

          <CardContent className="p-6 relative">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="p-1.5 rounded-lg"
                    style={{ background: "oklch(0.68 0.22 278 / 0.20)" }}
                  >
                    <Wallet className="w-4 h-4" style={{ color: "oklch(0.82 0.18 278)" }} />
                  </div>
                  <span className="text-sm font-medium" style={{ color: "oklch(0.78 0.15 278)" }}>
                    Available Balance
                  </span>
                </div>
                <p className="text-3xl font-extrabold text-white tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
                  {formatCurrency(balance, currency)}
                </p>
                <p className="text-xs mt-1.5" style={{ color: "oklch(0.68 0.12 278)" }}>
                  {currency}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
                onClick={() => router.refresh()}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                size="sm"
                className="flex-1 font-semibold"
                style={{
                  background: "linear-gradient(135deg, oklch(0.68 0.22 278), oklch(0.55 0.24 278))",
                  color: "#fff",
                  boxShadow: "0 4px 14px oklch(0.68 0.22 278 / 0.40)",
                }}
                onClick={() => setOpen(true)}
              >
                <Plus className="w-4 h-4" />
                Fund Wallet
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                asChild
              >
                <a href="/dashboard/buy">
                  <Zap className="w-4 h-4" />
                  Buy Number
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                asChild
              >
                <a href="/dashboard/social">
                  <ArrowUpRight className="w-4 h-4" />
                  Delivery Logs
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Fund Wallet Dialog */}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setFundLegalAccepted(false);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Fund Wallet</DialogTitle>
            <DialogDescription>
              Add funds via card or USSD
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="mb-2 block text-xs text-muted-foreground">Quick Amount (₦)</Label>
              <div className="grid grid-cols-4 gap-2">
                {quickAmounts.map((q) => (
                  <button
                    key={q}
                    onClick={() => setAmount(q.toString())}
                    className="py-2 rounded-xl text-sm font-semibold border transition-all"
                    style={
                      amount === q.toString()
                        ? {
                            background: "oklch(0.68 0.22 278 / 0.18)",
                            borderColor: "oklch(0.68 0.22 278 / 0.50)",
                            color: "var(--primary)",
                          }
                        : {
                            background: "transparent",
                            borderColor: "var(--border)",
                            color: "var(--muted-foreground)",
                          }
                    }
                  >
                    ₦{q.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fund-amount">Custom Amount (₦)</Label>
              <Input
                id="fund-amount"
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
              style={{
                background: "linear-gradient(135deg, oklch(0.68 0.22 278), oklch(0.55 0.24 278))",
                color: "#fff",
              }}
              onClick={handleTopup}
              disabled={loading || !amount || !fundLegalAccepted}
            >
              {loading
                ? "Redirecting to payment…"
                : `Pay ${amount ? `₦${parseFloat(amount).toLocaleString()}` : ""}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
