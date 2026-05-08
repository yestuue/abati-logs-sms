"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Copy, Check, Clock, Globe, Flag, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCountdown } from "@/lib/utils";
import type { VirtualNumber } from "@prisma/client";
import { toast } from "sonner";

interface ActiveNumbersProps {
  numbers: VirtualNumber[];
}

export function ActiveNumbers({ numbers }: ActiveNumbersProps) {
  const router = useRouter();
  const [copied, setCopied] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());

  // Update countdown every second
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll for OTPs every 7 seconds for all active numbers
  useEffect(() => {
    if (numbers.length === 0) return;

    const pollInterval = setInterval(async () => {
      let hasUpdates = false;
      for (const num of numbers) {
        if (num.status !== "ASSIGNED" || !num.orderId) continue;
        try {
          const res = await fetch(`/api/numbers/otp-status/${num.orderId}`);
          if (res.ok) {
            const data = await res.json();
            // If new SMS detected, we should refresh to show it in the inbox
            if (data.sms && data.sms.length > 0) {
              hasUpdates = true;
            }
          }
        } catch (err) {
          console.error("Polling error for", num.number, err);
        }
      }
      if (hasUpdates) {
        router.refresh();
      }
    }, 7000);

    return () => clearInterval(pollInterval);
  }, [numbers, router]);

  async function copyNumber(num: string) {
    try {
      await navigator.clipboard.writeText(num);
      setCopied(num);
      toast.success("Number copied to clipboard");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Failed to copy number");
    }
  }

  async function cancelNumber(numberId: string) {
    setCancellingId(numberId);
    try {
      const res = await fetch("/api/sms/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numberId }),
      });
      
      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Failed to parse server response");
      }

      if (!res.ok) {
        toast.error(data.error ?? "Cancel failed");
        return;
      }
      toast.success(data.refunded ? "Order cancelled and refund completed" : "Order cancelled");
      router.refresh();
    } catch (err: any) {
      console.error("Cancel error:", err);
      toast.error(err?.message || "Network error while cancelling number");
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <Card className="overflow-hidden border-none bg-background/50 backdrop-blur-xl">
      <CardHeader className="pb-3 border-b border-border/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Globe className="w-4 h-4 text-primary" />
            </div>
            <CardTitle className="text-base font-bold tracking-tight">Active Numbers</CardTitle>
          </div>
          <Badge variant={numbers.length > 0 ? "success" : "secondary"} className="font-mono">
            {numbers.length} ACTIVE
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {numbers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="p-4 rounded-full bg-muted/30 mb-4">
              <Flag className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-bold text-foreground">
              No active numbers
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto">
              Purchase a number to receive OTPs instantly
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/10">
            {numbers.map((n, i) => {
              const isExpiringSoon =
                n.expiresAt &&
                new Date(n.expiresAt).getTime() - now.getTime() < 1000 * 60 * 5; // 5 minutes

              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group flex items-center gap-4 px-5 py-4 hover:bg-primary/[0.02] transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base font-mono font-bold tracking-tight text-foreground">
                        {n.number}
                      </span>
                      <button
                        onClick={() => copyNumber(n.number)}
                        className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
                        title="Copy number"
                      >
                        {copied === n.number ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="secondary" className="text-[10px] uppercase font-bold py-0 h-4 px-1.5">
                          {n.server === "SERVER1" ? "🇺🇸 USA" : "🌍 Global"}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                          {n.operator || "Auto"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className={`w-3 h-3 ${isExpiringSoon ? "text-red-500 animate-pulse" : "text-muted-foreground"}`} />
                        <span
                          className={`text-xs font-mono font-medium ${
                            isExpiringSoon
                              ? "text-red-500"
                              : "text-muted-foreground"
                          }`}
                        >
                          {n.expiresAt
                            ? formatCountdown(n.expiresAt)
                            : "--:--"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => void cancelNumber(n.id)}
                      disabled={cancellingId === n.id}
                      className="px-4 py-2 text-xs font-bold rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50"
                    >
                      {cancellingId === n.id ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        "Cancel"
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
