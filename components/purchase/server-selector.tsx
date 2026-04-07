"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  Copy,
  Check,
  Loader2,
  Search,
  RefreshCw,
  ShoppingCart,
  Wallet,
  AlertCircle,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatCurrency, normalizeServiceSearchQuery } from "@/lib/utils";
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
  /** Inventory rows can be purchased; provider search rows are availability-only. */
  source: "inventory" | "provider";
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
    glow: "0 0 0 2px rgba(59,130,246,0.5), 0 0 16px rgba(59,130,246,0.15)",
    activeBorder: "rgba(59,130,246,0.4)",
  },
  SERVER2: {
    label: "Server 2",
    sublabel: "Global Numbers",
    description: "Numbers from 50+ countries. Great for international platforms.",
    icon: "🌍",
    glow: "0 0 0 2px oklch(0.68 0.22 278 / 0.50), 0 0 16px oklch(0.68 0.22 278 / 0.15)",
    activeBorder: "oklch(0.68 0.22 278 / 0.40)",
  },
};

type Carrier = "any" | "att" | "tmobile";

const MIN_SERVICE_QUERY_LEN = 2;

const CARRIERS: { value: Carrier; label: string; premium: boolean }[] = [
  { value: "any",     label: "Any Carrier",    premium: false },
  { value: "att",     label: "AT&T (+35%)",    premium: true  },
  { value: "tmobile", label: "T-Mobile (+35%)", premium: true  },
];

export function ServerSelector({
  walletBalance,
  walletCurrency,
  serverConfigs,
  userId: _userId,
}: ServerSelectorProps) {
  const router = useRouter();
  const [activeServer, setActiveServer] = useState<"SERVER1" | "SERVER2">("SERVER1");
  const [numbers, setNumbers] = useState<NumberItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<NumberItem | null>(null);
  const [buying, setBuying] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [carrier, setCarrier] = useState<Carrier>("any");

  const activeServerConfig = serverConfigs.find((c) => c.server === activeServer);
  const isDisabled = activeServerConfig ? !activeServerConfig.isEnabled : false;

  const performSearch = useCallback(async (rawQuery: string) => {
    const normalized = normalizeServiceSearchQuery(rawQuery);
    if (normalized.length < MIN_SERVICE_QUERY_LEN) {
      setNumbers([]);
      return;
    }

    setLoading(true);
    try {
      if (activeServer === "SERVER1") {
        const res = await fetch(
          `/api/numbers/search?service=${encodeURIComponent(normalized)}&limit=30`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error ?? "Search failed");
          setNumbers([]);
          return;
        }
        const rows = (data.numbers ?? []) as {
          phoneNumber: string;
          friendlyName: string;
          region: string;
          country: string;
          priceNGN: number;
          priceUSD: number;
        }[];
        setNumbers(
          rows.map((r) => ({
            id: `provider:${r.phoneNumber}`,
            number: r.phoneNumber,
            country: r.region ? `${r.region} (${r.country})` : r.country,
            countryCode: r.country,
            dialCode: "+1",
            server: "SERVER1" as const,
            priceNGN: r.priceNGN,
            priceUSD: r.priceUSD,
            source: "provider" as const,
          }))
        );
        return;
      }

      const res = await fetch(
        `/api/numbers/fetch?server=SERVER2&q=${encodeURIComponent(normalized)}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Search failed");
        setNumbers([]);
        return;
      }
      const nums = (data.numbers ?? []) as (Omit<NumberItem, "source" | "dialCode"> & {
        dialCode?: string | null;
      })[];
      setNumbers(
        nums.map((n) => ({
          ...n,
          dialCode: n.dialCode ?? "",
          source: "inventory" as const,
        }))
      );
    } catch {
      toast.error("Search failed");
      setNumbers([]);
    } finally {
      setLoading(false);
    }
  }, [activeServer]);

  function switchServer(srv: "SERVER1" | "SERVER2") {
    if (srv === activeServer) return;
    setActiveServer(srv);
    setSearch("");
    setNumbers([]);
  }

  useEffect(() => {
    if (isDisabled) return;
    const trimmed = search.trim();
    if (trimmed.length < MIN_SERVICE_QUERY_LEN) {
      setNumbers([]);
      setLoading(false);
      return;
    }
    const t = window.setTimeout(() => {
      void performSearch(search);
    }, 400);
    return () => window.clearTimeout(t);
  }, [search, activeServer, isDisabled, performSearch]);

  const queryReady = search.trim().length >= MIN_SERVICE_QUERY_LEN;

  // Apply +35% carrier premium for specific carriers
  const carrierPremiumMultiplier = CARRIERS.find((c) => c.value === carrier)?.premium ? 1.35 : 1.0;

  function getPriceWithCarrier(basePrice: number) {
    return Math.ceil(basePrice * carrierPremiumMultiplier);
  }

  async function handlePurchase() {
    if (!selected) return;
    if (selected.source === "provider") return;
    setBuying(true);
    const basePrice = walletCurrency === "USD" ? selected.priceUSD : selected.priceNGN;
    const price = getPriceWithCarrier(basePrice);
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
      if (!res.ok) { toast.error(data.error ?? "Purchase failed"); return; }
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

  return (
    <div className="space-y-4">
      {/* Wallet balance */}
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

      {/* Server selector cards */}
      <div className="grid grid-cols-2 gap-3">
        {(["SERVER1", "SERVER2"] as const).map((srv) => {
          const info = SERVER_INFO[srv];
          const cfg = serverConfigs.find((c) => c.server === srv);
          const disabled = cfg ? !cfg.isEnabled : false;
          const isActive = activeServer === srv;

          return (
            <button
              key={srv}
              disabled={disabled}
              onClick={() => switchServer(srv)}
              className="relative rounded-xl p-4 text-left transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
              style={{
                background: isActive ? "var(--card)" : "var(--muted)",
                border: `1px solid ${isActive ? info.activeBorder : "var(--border)"}`,
                boxShadow: isActive ? info.glow : "none",
              }}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl leading-none">{info.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm text-foreground">
                      {info.label}
                    </span>
                    {isActive && (
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider"
                        style={{
                          background: "oklch(0.68 0.22 278 / 0.15)",
                          color: "var(--primary)",
                          border: "1px solid oklch(0.68 0.22 278 / 0.25)",
                        }}
                      >
                        Active
                      </span>
                    )}
                    {disabled && (
                      <Badge variant="warning" className="text-[9px] px-1">
                        Offline
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {info.sublabel}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Carrier selector — only for USA (SERVER1) */}
      {activeServer === "SERVER1" && (
        <div
          className="p-3 rounded-xl"
          style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
        >
          <p className="text-xs font-semibold text-foreground mb-2.5">
            Carrier Preference
            <span className="text-muted-foreground font-normal ml-1.5">
              (specific carriers add a +35% premium)
            </span>
          </p>
          <div className="flex gap-2 flex-wrap">
            {CARRIERS.map((c) => (
              <button
                key={c.value}
                onClick={() => setCarrier(c.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={
                  carrier === c.value
                    ? {
                        background: "linear-gradient(135deg, oklch(0.68 0.22 278), oklch(0.55 0.24 278))",
                        color: "#fff",
                        boxShadow: "0 2px 8px oklch(0.68 0.22 278 / 0.30)",
                      }
                    : {
                        background: "var(--card)",
                        color: "var(--muted-foreground)",
                        border: "1px solid var(--border)",
                      }
                }
              >
                {c.label}
              </button>
            ))}
          </div>
          {carrierPremiumMultiplier > 1 && (
            <p className="text-xs mt-2" style={{ color: "oklch(0.68 0.22 278)" }}>
              ⚡ +35% carrier premium applied to all prices below
            </p>
          )}
        </div>
      )}

      {/* Number list card */}
      {isDisabled ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="w-8 h-8 text-amber-400 mb-3" />
            <p className="font-medium">Server Temporarily Offline</p>
            <p className="text-sm text-muted-foreground mt-1">
              {SERVER_INFO[activeServer].label} is under maintenance. Try the other server.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <span>{SERVER_INFO[activeServer].icon}</span>
                  {SERVER_INFO[activeServer].label} — {SERVER_INFO[activeServer].sublabel}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {SERVER_INFO[activeServer].description}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                disabled={!queryReady}
                onClick={() => queryReady && void performSearch(search)}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>

            {/* Search */}
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Type a service name (e.g. WhatsApp, Telegram)…"
                className="pl-8 pr-8 h-9 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setSearch("")}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {!queryReady ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <Search className="w-7 h-7 text-muted-foreground mb-3 opacity-60" />
                <p className="text-sm font-medium text-foreground mb-1">Search by service</p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Enter at least {MIN_SERVICE_QUERY_LEN} characters (e.g. WhatsApp). Results load from our SMS provider
                  {activeServer === "SERVER2" ? " inventory" : ""} after you stop typing.
                </p>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Searching…</p>
              </div>
            ) : numbers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <Phone className="w-7 h-7 text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-foreground">No results found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try another service name or check back later.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
                <AnimatePresence initial={false}>
                  {numbers.map((n, i) => (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.15, delay: Math.min(i * 0.025, 0.2) }}
                      onClick={() => setSelected(n)}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-accent/30 transition-colors border-b border-border/20 last:border-0 sm:odd:border-r sm:border-border/20"
                    >
                      <div className="text-xl flex-shrink-0">{SERVER_INFO[activeServer].icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-mono font-semibold text-foreground">
                          {n.number}
                        </p>
                        <p className="text-xs text-muted-foreground">{n.country}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-primary">
                          ₦{getPriceWithCarrier(n.priceNGN).toLocaleString()}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {carrierPremiumMultiplier > 1 && (
                            <span className="line-through mr-1 opacity-60">₦{n.priceNGN.toLocaleString()}</span>
                          )}
                          ${getPriceWithCarrier(n.priceUSD).toFixed(2)}
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
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Purchase dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Purchase</DialogTitle>
            <DialogDescription>This will deduct from your wallet balance</DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              {selected.source === "provider" && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-sm text-amber-200">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  Provider availability preview — purchase uses inventory numbers (try Server 2 search or contact support).
                </div>
              )}
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
                  <span className="font-medium">Base Price</span>
                  <span className="text-muted-foreground">₦{selected.priceNGN.toLocaleString()}</span>
                </div>
                {carrierPremiumMultiplier > 1 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium" style={{ color: "oklch(0.68 0.22 278)" }}>Carrier Premium</span>
                    <span style={{ color: "oklch(0.68 0.22 278)" }}>+35%</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm border-t border-border/30 pt-2">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-primary text-base">
                    ₦{getPriceWithCarrier(selected.priceNGN).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm p-3 rounded-xl bg-primary/5 border border-primary/20">
                <span className="text-muted-foreground">Wallet Balance After</span>
                <span
                  className={`font-semibold ${
                    walletBalance < getPriceWithCarrier(selected.priceNGN) ? "text-destructive" : "text-emerald-400"
                  }`}
                >
                  {formatCurrency(Math.max(0, walletBalance - getPriceWithCarrier(selected.priceNGN)), "NGN")}
                </span>
              </div>

              {walletBalance < getPriceWithCarrier(selected.priceNGN) && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  Insufficient balance. Please top up your wallet first.
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button
              variant="brand"
              onClick={handlePurchase}
              disabled={
                buying ||
                !selected ||
                selected.source === "provider" ||
                walletBalance < getPriceWithCarrier(selected?.priceNGN ?? 0)
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
