"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flag,
  Globe,
  Phone,
  Copy,
  Check,
  Loader2,
  Search,
  RefreshCw,
  ShoppingCart,
  Wallet,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface NumberItem {
  id: string;
  number: string;
  country: string;
  countryCode: string;
  dialCode: string;
  server: "SERVER1" | "SERVER2";
  priceNGN: number;
  priceUSD: number;
}

interface ServerSelectorProps {
  walletBalance: number;
  walletCurrency: "NGN" | "USD";
  serverConfigs: { server: "SERVER1" | "SERVER2"; name: string; isEnabled: boolean }[];
  userId: string;
}

const SERVER_INFO = {
  SERVER1: {
    label: "Server 1",
    sublabel: "USA Numbers",
    description: "Optimized US numbers (+1). Best for US-based OTP verification.",
    icon: "🇺🇸",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
  },
  SERVER2: {
    label: "Server 2",
    sublabel: "Global Numbers",
    description: "Numbers from 50+ countries. Great for international platforms.",
    icon: "🌍",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
  },
};

export function ServerSelector({
  walletBalance,
  walletCurrency,
  serverConfigs,
  userId,
}: ServerSelectorProps) {
  const router = useRouter();
  const [activeServer, setActiveServer] = useState<"SERVER1" | "SERVER2">("SERVER1");
  const [numbers, setNumbers] = useState<NumberItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<NumberItem | null>(null);
  const [buying, setBuying] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchNumbers = useCallback(async (server: "SERVER1" | "SERVER2") => {
    setLoading(true);
    setNumbers([]);
    try {
      const res = await fetch(`/api/numbers/fetch?server=${server}`);
      const data = await res.json();
      setNumbers(data.numbers ?? []);
    } catch {
      toast.error("Failed to load numbers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNumbers(activeServer);
  }, [activeServer, fetchNumbers]);

  const filtered = numbers.filter(
    (n) =>
      n.number.includes(search) ||
      n.country.toLowerCase().includes(search.toLowerCase())
  );

  async function handlePurchase() {
    if (!selected) return;
    setBuying(true);

    const price = walletCurrency === "USD" ? selected.priceUSD : selected.priceNGN;

    if (walletBalance < price) {
      toast.error("Insufficient wallet balance. Please top up first.");
      setBuying(false);
      return;
    }

    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "NUMBER_PURCHASE",
          numberId: selected.id,
          amount: selected.priceNGN,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Purchase failed");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else if (data.success) {
        toast.success(`${selected.number} assigned to your account!`);
        setSelected(null);
        router.push("/dashboard");
      }
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setBuying(false);
    }
  }

  async function copyNumber(num: string) {
    await navigator.clipboard.writeText(num);
    setCopied(num);
    toast.success("Copied!");
    setTimeout(() => setCopied(null), 2000);
  }

  const config = serverConfigs.find((c) => c.server === activeServer);
  const isDisabled = config ? !config.isEnabled : false;

  return (
    <div className="space-y-4">
      {/* Wallet balance indicator */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border border-border/30">
        <Wallet className="w-4 h-4 text-primary" />
        <span className="text-sm text-muted-foreground">
          Wallet Balance:{" "}
          <span className="font-semibold text-foreground">
            {formatCurrency(walletBalance, walletCurrency)}
          </span>
        </span>
        <Button variant="ghost" size="sm" className="ml-auto h-7 text-xs" asChild>
          <a href="/dashboard">Top Up</a>
        </Button>
      </div>

      {/* Server tabs */}
      <Tabs
        value={activeServer}
        onValueChange={(v) => setActiveServer(v as "SERVER1" | "SERVER2")}
      >
        <TabsList className="w-full h-auto p-1.5 gap-2 bg-muted">
          {(["SERVER1", "SERVER2"] as const).map((srv) => {
            const info = SERVER_INFO[srv];
            const cfg = serverConfigs.find((c) => c.server === srv);
            const disabled = cfg ? !cfg.isEnabled : false;
            return (
              <TabsTrigger
                key={srv}
                value={srv}
                disabled={disabled}
                className="flex-1 h-auto py-3 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl"
              >
                <div className="flex flex-col items-center gap-1 sm:flex-row sm:gap-2">
                  <span className="text-lg">{info.icon}</span>
                  <div className="text-left hidden sm:block">
                    <div className="font-semibold text-sm">{info.label}</div>
                    <div className="text-xs opacity-70">{info.sublabel}</div>
                  </div>
                  <span className="sm:hidden text-xs font-medium">{info.label}</span>
                  {disabled && (
                    <Badge variant="warning" className="text-[10px] px-1 ml-auto">
                      Offline
                    </Badge>
                  )}
                </div>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {(["SERVER1", "SERVER2"] as const).map((srv) => {
          const info = SERVER_INFO[srv];
          return (
            <TabsContent key={srv} value={srv}>
              {isDisabled ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <AlertCircle className="w-8 h-8 text-amber-400 mb-3" />
                    <p className="font-medium">Server Temporarily Offline</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {info.label} is currently under maintenance. Try{" "}
                      {srv === "SERVER1" ? "Server 2" : "Server 1"} instead.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <span>{info.icon}</span>
                          {info.label} — {info.sublabel}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          {info.description}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                        onClick={() => fetchNumbers(srv)}
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                      </Button>
                    </div>

                    {/* Search */}
                    <div className="relative mt-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Search by number or country…"
                        className="pl-8 h-8 text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                  </CardHeader>

                  <CardContent className="p-0">
                    {loading ? (
                      <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : filtered.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Phone className="w-6 h-6 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {search ? "No numbers match your search" : "No available numbers"}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y divide-border/30 sm:divide-y-0">
                        {filtered.map((n, i) => (
                          <motion.div
                            key={n.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            onClick={() => setSelected(n)}
                            className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-accent/30 transition-colors border-b border-border/20 last:border-0 sm:border-r sm:even:border-r-0"
                          >
                            <div className="text-xl flex-shrink-0">{info.icon}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-mono font-semibold text-foreground">
                                {n.number}
                              </p>
                              <p className="text-xs text-muted-foreground">{n.country}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-semibold text-primary">
                                ₦{n.priceNGN.toLocaleString()}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                ${n.priceUSD.toFixed(2)}
                              </p>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); copyNumber(n.number); }}
                              className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground"
                            >
                              {copied === n.number ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Purchase dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Purchase</DialogTitle>
            <DialogDescription>
              This will deduct from your wallet balance
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-muted/50 border border-border/30 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Number</span>
                  <span className="font-mono font-semibold">{selected.number}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Country</span>
                  <span>{selected.country}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Server</span>
                  <Badge variant={selected.server === "SERVER1" ? "info" : "success"}>
                    {selected.server === "SERVER1" ? "🇺🇸 Server 1" : "🌍 Server 2"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm border-t border-border/30 pt-2 mt-2">
                  <span className="font-medium">Price</span>
                  <span className="font-bold text-primary text-base">
                    ₦{selected.priceNGN.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm p-3 rounded-xl bg-primary/5 border border-primary/20">
                <span className="text-muted-foreground">Wallet Balance After</span>
                <span
                  className={`font-semibold ${
                    walletBalance < selected.priceNGN
                      ? "text-destructive"
                      : "text-emerald-400"
                  }`}
                >
                  {formatCurrency(
                    Math.max(0, walletBalance - selected.priceNGN),
                    "NGN"
                  )}
                </span>
              </div>

              {walletBalance < selected.priceNGN && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  Insufficient balance. Please top up your wallet first.
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelected(null)}>
              Cancel
            </Button>
            <Button
              variant="brand"
              onClick={handlePurchase}
              disabled={
                buying ||
                !selected ||
                walletBalance < (selected?.priceNGN ?? 0)
              }
            >
              {buying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  Buy Now
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
