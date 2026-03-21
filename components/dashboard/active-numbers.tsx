"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Clock, Globe, Flag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCountdown } from "@/lib/utils";
import type { VirtualNumber } from "@prisma/client";
import { toast } from "sonner";

interface ActiveNumbersProps {
  numbers: VirtualNumber[];
}

export function ActiveNumbers({ numbers }: ActiveNumbersProps) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copyNumber(num: string) {
    await navigator.clipboard.writeText(num);
    setCopied(num);
    toast.success("Number copied!");
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Active Numbers</CardTitle>
          <Badge variant={numbers.length > 0 ? "success" : "secondary"}>
            {numbers.length} active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {numbers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-6">
            <div className="p-3 rounded-2xl bg-muted mb-3">
              <Flag className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              No active numbers
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Purchase a number to start receiving OTPs
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {numbers.map((n, i) => {
              const isExpiringSoon =
                n.expiresAt &&
                new Date(n.expiresAt).getTime() - Date.now() < 1000 * 60 * 60 * 24;

              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-accent/30 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-3.5 h-3.5 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-semibold text-foreground">
                        {n.number}
                      </span>
                      <Badge variant="info" className="text-[10px] px-1.5 py-0">
                        {n.server === "SERVER1" ? "🇺🇸 USA" : "🌍 Global"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span
                        className={`text-xs ${
                          isExpiringSoon
                            ? "text-amber-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {n.expiresAt
                          ? `Expires in ${formatCountdown(n.expiresAt)}`
                          : "No expiry"}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => copyNumber(n.number)}
                    className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
                    title="Copy number"
                  >
                    {copied === n.number ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
