"use client";
import { useState } from "react";
import { Loader2, Banknote, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface WithdrawalFormProps {
  totalProfit: number;
}

export function WithdrawalForm({ totalProfit }: WithdrawalFormProps) {
  const [amount, setAmount]     = useState("");
  const [bankInfo, setBankInfo] = useState("");
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);

  const amountNum   = parseFloat(amount) || 0;
  const insufficient = amountNum > totalProfit;
  const invalid      = amountNum <= 0 || !bankInfo.trim() || insufficient;

  async function handleRequest() {
    if (invalid) return;
    setLoading(true);

    try {
      const res = await fetch("/api/admin/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountNum, bankInfo: bankInfo.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Withdrawal request failed");
        return;
      }

      setDone(true);
      toast.success("Withdrawal request submitted!");
      setAmount("");
      setBankInfo("");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const MINT      = "oklch(0.80 0.19 162)";
  const MINT_DARK = "oklch(0.68 0.17 162)";

  return (
    <Card style={{ border: "1px solid oklch(0.80 0.19 162 / 0.30)" }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Banknote className="w-4 h-4" style={{ color: MINT }} />
          Withdraw Earnings
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Available profit:{" "}
          <span className="font-bold" style={{ color: MINT }}>
            ₦{totalProfit.toLocaleString()}
          </span>
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {done && (
          <div
            className="flex items-center gap-3 p-3 rounded-xl text-sm"
            style={{ background: `${MINT}10`, border: `1px solid ${MINT}28` }}
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: MINT }} />
            <span style={{ color: MINT }}>Request submitted — you will be notified once processed.</span>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="withdraw-amount">Amount (₦)</Label>
          <Input
            id="withdraw-amount"
            type="number"
            placeholder="e.g. 5000"
            min={1}
            max={totalProfit}
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setDone(false); }}
          />
          {insufficient && (
            <p className="text-xs flex items-center gap-1 text-destructive">
              <AlertCircle className="w-3 h-3" />
              Amount exceeds available profit (₦{totalProfit.toLocaleString()})
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bank-info">Bank Name &amp; Account Number</Label>
          <Input
            id="bank-info"
            placeholder="e.g. GTBank — 0123456789"
            value={bankInfo}
            onChange={(e) => { setBankInfo(e.target.value); setDone(false); }}
          />
        </div>

        <Button
          className="w-full font-bold"
          disabled={loading || invalid}
          onClick={handleRequest}
          style={invalid
            ? {}
            : {
                background: `linear-gradient(135deg, ${MINT}, ${MINT_DARK})`,
                color: "#09090d",
                boxShadow: `0 4px 14px ${MINT}40`,
              }}
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
          ) : (
            <><Banknote className="w-4 h-4" /> Withdraw to Bank</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
