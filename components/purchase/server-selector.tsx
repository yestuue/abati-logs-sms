"use client";
import Link from "next/link";
import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  Copy,
  Check,
  CheckCircle2,
  Loader2,
  Search,
  RefreshCw,
  ShoppingCart,
  Wallet,
  AlertCircle,
  X,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatCurrency, formatCountdown, normalizeServiceSearchQuery } from "@/lib/utils";
import {
  finalNumberPurchasePriceNGN,
} from "@/lib/number-purchase-price";
import { toast } from "sonner";

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

interface ServiceSearchResult {
  id: string;
  serviceKey: string;
  serviceName: string;
  availableCount: number;
  priceNGN: number;
  premiumRate?: number;
}

interface ActiveAssignment {
  id: string;
  number: string;
  country: string;
  server: string;
  expiresAt: string | null;
  lastSms: { body: string; createdAt: string } | null;
}

interface CountryOption {
  id: string;
  slug: string;
  name: string;
  iso2?: string | null;
  /** Admin-configured NGN hint for this country (Server 2). */
  samplePrice?: number | null;
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

const CARRIERS: { value: Carrier; label: string }[] = [
  { value: "any", label: "Any Carrier" },
  { value: "att", label: "AT&T" },
  { value: "tmobile", label: "T-Mobile" },
];

function sanitizeAreaCodeInput(raw: string): string {
  return raw.replace(/[^\d,]/g, "");
}

const HOW_IT_WORKS_RULES = [
  "Select a service and click Get Number — number slot appears instantly",
  "Credits are only charged if you receive a verification code",
  "Cancel after 1 minute if no code arrives — full refund",
  "If no OTP before expiry — automatic full refund",
  "After OTP received — 10 extra minutes grace period",
  "Carrier or area code preference adds the service premium rate to the price",
] as const;

function extractOtp(body: string): string | null {
  const m = body.match(/\b\d{4,8}\b/);
  return m ? m[0] : null;
}

function flagFromIso2(iso2?: string | null): string {
  if (!iso2 || iso2.length !== 2) return "🌍";
  return iso2
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join("");
}

export function ServerSelector({
  walletBalance,
  walletCurrency,
  serverConfigs,
  userId: _userId,
}: ServerSelectorProps) {
  const [activeServer, setActiveServer] = useState<"SERVER1" | "SERVER2">("SERVER1");
  const [numbers, setNumbers] = useState<NumberItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<NumberItem | null>(null);
  const [buying, setBuying] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [carrier, setCarrier] = useState<Carrier>("any");
  const [serviceResults, setServiceResults] = useState<ServiceSearchResult[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceSearchResult | null>(null);
  const [server2Country, setServer2Country] = useState("usa");
  const [server2CountryId, setServer2CountryId] = useState<string>("usa");
  const [countrySearch, setCountrySearch] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);
  const [preferredAreaCode, setPreferredAreaCode] = useState("");
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [activeAssignments, setActiveAssignments] = useState<ActiveAssignment[]>([]);
  const [loadingActive, setLoadingActive] = useState(false);
  const [purchaseLegalAccepted, setPurchaseLegalAccepted] = useState(false);
  const [serviceFetchError, setServiceFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (selected) setPurchaseLegalAccepted(false);
  }, [selected?.id]);

  const activeServerConfig = serverConfigs.find((c) => c.server === activeServer);
  const isDisabled = activeServerConfig ? !activeServerConfig.isEnabled : false;

  const performSearch = useCallback(
    async (rawQuery: string, countrySlug: string) => {
      const normalized = normalizeServiceSearchQuery(rawQuery);
      if (normalized.length < MIN_SERVICE_QUERY_LEN) {
        setServiceResults([]);
        setServiceFetchError(null);
        return;
      }

      setLoading(true);
      try {
        const countryIdQs =
          activeServer === "SERVER2" && server2CountryId
            ? `&countryId=${encodeURIComponent(server2CountryId)}`
            : "";
        const searchRes = await fetch(
          `/api/numbers/search?service=${encodeURIComponent(normalized)}&limit=30&country=${encodeURIComponent(countrySlug)}&server=${encodeURIComponent(activeServer)}${countryIdQs}`,
          { cache: "no-store" }
        );
        const searchData = await searchRes.json();
        if (!searchRes.ok) {
          const msg =
            searchData?.error ??
            (searchRes.status === 401
              ? "Invalid API Key"
              : searchRes.status === 404
                ? "Server 2 Busy"
                : "Search failed");
          setServiceFetchError(msg);
          toast.error(msg);
          setServiceResults([]);
          return;
        }
        setServiceFetchError(null);

        const svcRows = (searchData.services ?? []) as {
          key: string;
          name: string;
          qty: number;
          priceNGN: number;
          premiumRate?: number;
        }[];
        const mapped: ServiceSearchResult[] = svcRows.map((s) => ({
          id: `service:${s.key}`,
          serviceKey: s.key,
          serviceName: s.name,
          availableCount: s.qty,
          priceNGN: s.priceNGN,
          premiumRate: typeof s.premiumRate === "number" ? s.premiumRate : 0.35,
        }))
          .sort((a, b) => a.serviceName.localeCompare(b.serviceName, "en", { sensitivity: "base" }));
        setServiceResults(mapped);

        setSelectedService((prev) => {
          if (!prev) return null;
          const row = mapped.find((m) => m.serviceKey === prev.serviceKey);
          if (!row) return prev;
          return { ...row };
        });
      } catch {
        setServiceFetchError("Server 2 Busy");
        toast.error("Search failed");
        setServiceResults([]);
      } finally {
        setLoading(false);
      }
    },
    [activeServer, server2CountryId]
  );

  const loadInventoryServer2 = useCallback(async () => {
    try {
      const selectedCountrySlug = countries.find((c) => c.slug === server2Country)?.slug ?? server2Country;
      const countryIdQs = server2CountryId ? `&countryId=${encodeURIComponent(server2CountryId)}` : "";
      const invRes = await fetch(
        `/api/numbers/fetch?server=SERVER2&country=${encodeURIComponent(selectedCountrySlug)}${countryIdQs}`,
        { cache: "no-store" }
      );
      const invData = await invRes.json();
      if (!invRes.ok) {
        setNumbers([]);
        return;
      }
      const nums = (invData.numbers ?? []) as (Omit<NumberItem, "source" | "dialCode"> & {
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
      setNumbers([]);
    }
  }, [countries, server2Country, server2CountryId]);

  const loadActiveAssignments = useCallback(async () => {
    setLoadingActive(true);
    try {
      const res = await fetch("/api/user/active-numbers", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) return;
      setActiveAssignments((data.numbers ?? []) as ActiveAssignment[]);
    } catch {
      /* ignore */
    } finally {
      setLoadingActive(false);
    }
  }, []);

  function switchServer(srv: "SERVER1" | "SERVER2") {
    if (srv === activeServer) return;
    setActiveServer(srv);
    setSearch("");
    setNumbers([]);
    setServiceResults([]);
    setSelectedService(null);
    setCountrySearch("");
    setCountryOpen(false);
    setPreferredAreaCode("");
    setServiceFetchError(null);
    if (srv === "SERVER2") {
      const row = countries.find((c) => c.slug === server2Country);
      setServer2CountryId(row?.id ?? server2Country);
    }
  }

  function selectServiceRow(row: ServiceSearchResult) {
    // Replace selected service immediately and hide the dropdown list.
    setSelectedService(row);
    setServiceResults([]);
    setCountryOpen(false);
  }

  function clearSearch() {
    setSearch("");
    setServiceResults([]);
    setNumbers([]);
    setSelectedService(null);
    setCountrySearch("");
    setCountryOpen(false);
    setPreferredAreaCode("");
    setServiceFetchError(null);
  }

  function onSearchChange(next: string) {
    setSearch(next);
    if (next.trim() === "") {
      setServiceResults([]);
      setNumbers([]);
      setSelectedService(null);
      setCountrySearch("");
      setCountryOpen(false);
      setPreferredAreaCode("");
      setServiceFetchError(null);
    }
  }

  useEffect(() => {
    if (activeServer !== "SERVER2") return;
    setServiceResults([]);
  }, [server2Country, activeServer]);

  useEffect(() => {
    if (isDisabled) return;
    const trimmed = search.trim();
    if (trimmed.length < MIN_SERVICE_QUERY_LEN) {
      setServiceResults([]);
      setNumbers([]);
      setSelectedService(null);
      setCountrySearch("");
      setCountryOpen(false);
      setPreferredAreaCode("");
      setLoading(false);
      return;
    }
    const countrySlug = activeServer === "SERVER1" ? "usa" : server2Country;
    const t = window.setTimeout(() => {
      void performSearch(search, countrySlug);
    }, 400);
    return () => window.clearTimeout(t);
  }, [search, activeServer, server2Country, isDisabled, performSearch]);

  useEffect(() => {
    void loadActiveAssignments();
    const id = window.setInterval(() => void loadActiveAssignments(), 15000);
    return () => window.clearInterval(id);
  }, [loadActiveAssignments]);

  useEffect(() => {
    if (activeServer !== "SERVER2") return;
    let cancelled = false;
    void (async () => {
      const res = await fetch("/api/numbers/countries", { cache: "no-store" });
      const data = await res.json();
      if (!cancelled && res.ok) {
        setCountries((data.countries ?? []) as CountryOption[]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeServer]);

  useEffect(() => {
    if (activeServer === "SERVER1") {
      setNumbers([]);
      return;
    }
    if (!selectedService) {
      setNumbers([]);
      return;
    }
    void loadInventoryServer2();
  }, [activeServer, selectedService, loadInventoryServer2]);

  useEffect(() => {
    if (activeServer !== "SERVER2" || !selectedService?.serviceKey) return;
    const key = selectedService.serviceKey;
    if (key.length < MIN_SERVICE_QUERY_LEN) return;
    let cancelled = false;
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          const idQs = server2CountryId
            ? `&countryId=${encodeURIComponent(server2CountryId)}`
            : "";
          const searchRes = await fetch(
            `/api/numbers/search?service=${encodeURIComponent(key)}&limit=10&country=${encodeURIComponent(server2Country)}&server=SERVER2${idQs}`,
            { cache: "no-store" }
          );
          const searchData = await searchRes.json();
          if (!searchRes.ok || cancelled) return;
          const svcRows = (searchData.services ?? []) as {
            key: string;
            name: string;
            qty: number;
            priceNGN: number;
            premiumRate?: number;
          }[];
          const row = svcRows.find((s) => s.key === key);
          if (row && !cancelled) {
            setSelectedService({
              id: `service:${row.key}`,
              serviceKey: row.key,
              serviceName: row.name,
              availableCount: row.qty,
              priceNGN: row.priceNGN,
              premiumRate: typeof row.premiumRate === "number" ? row.premiumRate : 0.35,
            });
          }
        } catch {
          /* ignore */
        }
      })();
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [server2Country, server2CountryId, activeServer, selectedService?.serviceKey]);

  useEffect(() => {
    if (countries.length === 0) return;
    setServer2Country((prev) =>
      countries.some((c) => c.slug === prev) ? prev : countries[0]!.slug
    );
  }, [countries]);

  useEffect(() => {
    const row = countries.find((c) => c.slug === server2Country);
    if (row) setServer2CountryId(row.id);
  }, [countries, server2Country]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== "visible" || isDisabled) return;
      const trimmed = search.trim();
      if (trimmed.length < MIN_SERVICE_QUERY_LEN) return;
      const countrySlug = activeServer === "SERVER1" ? "usa" : server2Country;
      void performSearch(search, countrySlug);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [search, activeServer, server2Country, isDisabled, performSearch]);

  useEffect(() => {
    if (!selectedService) {
      setCountrySearch("");
      setCountryOpen(false);
      return;
    }
    const selectedCountry = countries.find((c) => c.slug === server2Country);
    if (selectedCountry) {
      setCountrySearch(selectedCountry.name);
    }
  }, [selectedService, countries, server2Country]);

  const queryReady = search.trim().length >= MIN_SERVICE_QUERY_LEN;
  const selectedCountry =
    countries.find((c) => c.slug === server2Country) ??
    null;
  const filteredCountries = countries.filter((c) => {
    const q = countrySearch.trim().toLowerCase();
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q);
  });

  const server1PremiumActive = activeServer === "SERVER1";
  const hasAreaCodePreference = preferredAreaCode
    .split(",")
    .map((s) => s.trim())
    .some((s) => /^\d{3}$/.test(s));
  const hasCarrierPreference = carrier !== "any";
  const server1PreferencePremiumActive =
    server1PremiumActive && (hasCarrierPreference || hasAreaCodePreference);
  const server1PreferencePremiumRate = 0.35;
  const selectedPremiumRate =
    activeServer === "SERVER1"
      ? (server1PreferencePremiumActive ? server1PreferencePremiumRate : 0)
      : (selectedService?.premiumRate ?? 0.35);
  const premiumPercentLabel = 35;

  function getServer1Price(basePrice: number, premiumRate = selectedPremiumRate) {
    return Math.ceil(basePrice * (1 + premiumRate));
  }

  function getServer2CatalogDisplayPrice(basePrice: number, premiumRate = selectedPremiumRate) {
    return Math.ceil(basePrice * (1 + premiumRate));
  }

  function preferencePremiumDeltaNgn(basePrice: number, premiumRate: number) {
    return Math.ceil(basePrice * premiumRate);
  }

  const selectedServicePremiumDelta = useMemo(() => {
    if (!server1PreferencePremiumActive || !selectedService) return 0;
    return preferencePremiumDeltaNgn(selectedService.priceNGN, server1PreferencePremiumRate);
  }, [server1PreferencePremiumActive, selectedService]);

  /** Charge base must match /api/payments/initialize when serviceKey is sent (catalog / custom service price). */
  function getPurchaseChargeBase(item: NumberItem): number {
    if (selectedService?.serviceKey) {
      return selectedService.priceNGN;
    }
    return item.priceNGN;
  }

  function getPurchasePriceNGN(item: NumberItem) {
    return finalNumberPurchasePriceNGN(getPurchaseChargeBase(item), {
      server: item.server,
      carrier,
      areaCodesRaw: preferredAreaCode.trim(),
      premiumRate: selectedPremiumRate,
    });
  }

  /** Compare wallet balance to debit (NGN or USD-proportional). */
  function getPurchaseWalletDebit(item: NumberItem): number {
    const finalNGN = getPurchasePriceNGN(item);
    if (walletCurrency !== "USD") return finalNGN;
    const base = getPurchaseChargeBase(item);
    if (base <= 0) return item.priceUSD;
    return Math.round(((item.priceUSD * finalNGN) / base) * 100) / 100;
  }

  async function handlePurchase() {
    if (!selected) return;
    if (selected.source === "provider") return;
    setBuying(true);
    const finalNGN = getPurchasePriceNGN(selected);
    const purchaseDebit = getPurchaseWalletDebit(selected);
    if (walletBalance < purchaseDebit) {
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
          amount: finalNGN,
          carrier,
          areaCodes: preferredAreaCode.trim(),
          ...(selectedService?.serviceKey ? { serviceKey: selectedService.serviceKey } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Purchase failed"); return; }
      if (data.url) {
        window.location.href = data.url;
      } else if (data.success) {
        toast.success(`${selected.number} assigned to your account!`);
        setSelected(null);
        void loadActiveAssignments();
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
    <div className="space-y-6">
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
      {activeServer === "SERVER2" && (
        <div
          className="p-3 rounded-xl"
          style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
        >
          <p className="text-xs font-semibold text-foreground">US area codes</p>
          <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
            Configure <strong>Area Code(s)</strong> on <strong>Server 1</strong> (USA). That value is still sent with
            every checkout—including Server 2—so the backend receives your preference on each purchase.
          </p>
        </div>
      )}

      {activeServer === "SERVER1" && (
        <div
          className="p-3 rounded-xl"
          style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
        >
          <p className="text-xs font-semibold text-foreground mb-2.5">
            Carrier preference
            <span className="text-muted-foreground font-normal ml-1.5">
              (optional — specific carrier or area codes below adds one +{premiumPercentLabel}% premium, not stacked)
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
          <div className="mt-3 space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Area Code(s)</Label>
            <Input
              value={preferredAreaCode}
              placeholder="e.g. 212, 646, 917"
              className="h-9 text-black dark:text-zinc-100 bg-white dark:bg-zinc-900 border-zinc-200"
              onChange={(e) => setPreferredAreaCode(sanitizeAreaCodeInput(e.target.value))}
            />
            <p className="text-[11px] text-slate-500 dark:text-zinc-500">
              US area codes only (digits + commas). Premium applies when carrier is specific or any valid code is entered.
            </p>
          </div>
          {server1PreferencePremiumActive && (
            <p className="text-xs mt-2 font-medium text-amber-700 dark:text-amber-400">
              +{premiumPercentLabel}% preference premium applied to USA prices below (carrier and/or area codes — not stacked)
            </p>
          )}
        </div>
      )}

      {/* Numbers flow: search → active numbers → rules */}
      {isDisabled ? (
        <Card className="w-full max-w-[370px] mx-auto lg:max-w-none">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="w-8 h-8 text-amber-400 mb-3" />
            <p className="font-medium">Server Temporarily Offline</p>
            <p className="text-sm text-muted-foreground mt-1">
              {SERVER_INFO[activeServer].label} is under maintenance. Try the other server.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {activeServer === "SERVER2" && (
            <div className="w-full max-w-[354px] mx-auto lg:max-w-none space-y-2 mb-2">
              <Label className="text-sm font-medium text-[#2D2D2D] dark:text-zinc-100">
                Select country
              </Label>
              {countries.length === 0 ? (
                <p className="text-xs text-slate-600 dark:text-zinc-500 py-2">Loading countries…</p>
              ) : (
                <div className="relative">
                  <Input
                    value={countrySearch}
                    placeholder="Type country: USA, Nigeria…"
                    className="h-10 text-black dark:text-zinc-100 bg-white dark:bg-zinc-900 border-zinc-200"
                    onFocus={() => setCountryOpen(true)}
                    onChange={(e) => {
                      setCountrySearch(e.target.value);
                      setCountryOpen(true);
                    }}
                  />
                  {countryOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-zinc-200 bg-white dark:bg-zinc-950 shadow-[0_12px_40px_rgba(0,0,0,0.12)] max-h-64 overflow-y-auto">
                      {filteredCountries.length === 0 ? (
                        <div className="px-3 py-2.5 text-xs text-slate-600 dark:text-zinc-400">
                          No country found
                        </div>
                      ) : (
                        filteredCountries.map((c) => (
                          <button
                            key={c.slug}
                            type="button"
                            className="w-full text-left px-3 py-2.5 text-sm text-slate-900 dark:text-zinc-100 hover:bg-violet-50 dark:hover:bg-violet-950/30 border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                            onClick={() => {
                              setServer2Country(c.slug);
                              setServer2CountryId(c.id);
                              setCountrySearch(c.name);
                              setCountryOpen(false);
                            }}
                          >
                            <span className="flex items-center justify-between gap-2">
                              <span>
                                {flagFromIso2(c.iso2)} {c.name}
                              </span>
                              {c.samplePrice != null && c.samplePrice > 0 && (
                                <span className="text-[11px] text-muted-foreground font-normal tabular-nums">
                                  from ₦{Math.round(c.samplePrice).toLocaleString()}
                                </span>
                              )}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <Card className="relative z-30 w-full max-w-[354px] mx-auto lg:max-w-none overflow-visible rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-card shadow-sm">
            <CardHeader className="pb-3 bg-gradient-to-b from-violet-50/50 to-white dark:from-violet-950/20 dark:to-transparent border-b border-zinc-100 dark:border-zinc-900">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-[14px] flex items-center gap-1.5 font-semibold text-slate-900 dark:text-zinc-100">
                    <span>{SERVER_INFO[activeServer].icon}</span>
                    {SERVER_INFO[activeServer].label} — {SERVER_INFO[activeServer].sublabel}
                  </CardTitle>
                  <p className="text-[10.5px] text-slate-600 dark:text-zinc-400 mt-0.5 leading-snug">
                    {SERVER_INFO[activeServer].description}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  disabled={!queryReady}
                  onClick={() =>
                    queryReady &&
                    void performSearch(
                      search,
                      activeServer === "SERVER1" ? "usa" : server2Country
                    )
                  }
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </div>

              <p className="text-[12px] font-medium text-slate-700 dark:text-zinc-300 mt-2">
                Select Service
              </p>
              <div className="relative z-40 mt-1.5">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-400 pointer-events-none z-10" />
                <Input
                  placeholder="Search: WhatsApp, Telegram, Google…"
                  className="relative z-10 pl-8 pr-8 h-9 text-[11.5px] text-black dark:text-zinc-100 rounded-xl border-zinc-200 bg-white dark:bg-zinc-900 focus-visible:ring-violet-400/40"
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  autoComplete="off"
                />
                {search && (
                  <button
                    type="button"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 text-zinc-400 hover:text-zinc-700 transition-colors"
                    onClick={clearSearch}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}

                {queryReady && (loading || serviceResults.length > 0) && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-zinc-200 bg-white dark:bg-zinc-950 shadow-[0_12px_40px_rgba(0,0,0,0.12)] max-h-64 overflow-y-auto">
                    {loading ? (
                      <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-600 dark:text-zinc-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Searching…
                      </div>
                    ) : serviceResults.length === 0 ? (
                      <div className="py-8 px-4 text-center text-sm text-slate-600 dark:text-zinc-400">
                        No results found
                      </div>
                    ) : (
                      <ul className="py-1">
                        {serviceResults.map((row) => (
                          <li key={row.id}>
                            <button
                              type="button"
                              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                              onClick={() => selectServiceRow(row)}
                            >
                              <div className="min-w-0">
                                <p className="text-[13px] font-medium text-slate-900 dark:text-zinc-100 truncate">
                                  {row.serviceName}
                                </p>
                                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                  ({row.availableCount} available)
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <span
                                  className={`text-[13px] font-semibold block ${
                                    activeServer === "SERVER1" && server1PreferencePremiumActive
                                      ? "text-amber-500"
                                      : "text-violet-700 dark:text-violet-300"
                                  }`}
                                >
                                  ₦
                                  {(activeServer === "SERVER1"
                                    ? getServer1Price(row.priceNGN, row.premiumRate ?? 0.35)
                                    : getServer2CatalogDisplayPrice(row.priceNGN, row.premiumRate ?? 0.35)
                                  ).toLocaleString()}
                                </span>
                                {activeServer === "SERVER1" && server1PreferencePremiumActive && (
                                  <span className="text-[10px] font-medium text-amber-700/90 dark:text-amber-400/90 block mt-0.5">
                                    Premium price: +₦
                                    {preferencePremiumDeltaNgn(
                                      row.priceNGN,
                                      row.premiumRate ?? 0.35
                                    ).toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
              {serviceFetchError && (
                <p className="mt-1.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                  {serviceFetchError}
                </p>
              )}
            </CardHeader>
            <CardContent className="p-3 pt-0">
              {!queryReady && (
                <p className="text-center text-xs text-slate-500 dark:text-zinc-500 py-2">
                  Type at least {MIN_SERVICE_QUERY_LEN} characters to search services.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="w-full max-w-[354px] mx-auto lg:max-w-none rounded-2xl border border-zinc-200/90 dark:border-zinc-900 mb-8 mt-2 shadow-sm">
            <CardHeader className="pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <CardTitle className="text-[15px] font-semibold text-slate-900 dark:text-zinc-100">
                Active Numbers
              </CardTitle>
              <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                Your assigned lines, countdown, and latest OTP
              </p>
            </CardHeader>
            <CardContent className="p-3 space-y-4">
              {selectedService && search.trim() !== "" && (
                <div
                  className={
                    activeServer === "SERVER1" && server1PreferencePremiumActive
                      ? "rounded-xl border border-amber-500/50 bg-amber-50/80 dark:bg-amber-950/25 p-3"
                      : "rounded-xl border border-violet-300/60 bg-violet-50/80 dark:bg-violet-950/25 dark:border-violet-800 p-3"
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p
                        className={
                          activeServer === "SERVER1" && server1PreferencePremiumActive
                            ? "text-[11px] font-semibold uppercase tracking-wide text-amber-500"
                            : "text-[11px] font-semibold uppercase tracking-wide text-violet-800 dark:text-violet-300"
                        }
                      >
                        Selected service
                      </p>
                      <p className="text-[14px] font-semibold text-[#2D2D2D] dark:text-zinc-100">
                        {selectedService.serviceName}
                      </p>
                      {activeServer === "SERVER2" && selectedCountry && (
                        <p className="text-[11px] font-medium text-slate-700 dark:text-zinc-300 mt-0.5">
                          {flagFromIso2(selectedCountry.iso2)} {selectedCountry.name}
                        </p>
                      )}
                      <div
                        className={`text-[11px] font-medium mt-0.5 ${
                          activeServer === "SERVER1" && server1PreferencePremiumActive
                            ? "text-amber-500"
                            : "text-emerald-700 dark:text-emerald-400"
                        }`}
                      >
                        <p>
                          ({selectedService.availableCount} available) · ₦
                          {(activeServer === "SERVER1"
                            ? getServer1Price(selectedService.priceNGN)
                            : getServer2CatalogDisplayPrice(selectedService.priceNGN)
                          ).toLocaleString()}
                        </p>
                        {activeServer === "SERVER1" && server1PreferencePremiumActive && (
                          <p className="text-[10px] mt-0.5 opacity-95">
                            Premium price: +₦{selectedServicePremiumDelta.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="brand"
                      className="shrink-0 text-xs"
                      onClick={() => {
                        if (activeServer !== "SERVER2") return;
                        if (numbers.length === 0) {
                          toast.info("Inventory will appear here when numbers are in stock for this service.");
                          return;
                        }
                        const el = document.getElementById("abati-buy-inventory");
                        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                    >
                      Get Number
                    </Button>
                  </div>
                </div>
              )}

              {loadingActive && activeAssignments.length === 0 ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-600 dark:text-zinc-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading…
                </div>
              ) : activeAssignments.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <Phone className="w-8 h-8 mx-auto text-zinc-400 mb-2" />
                  <p className="text-sm font-medium text-[#2D2D2D] dark:text-zinc-200">No active numbers yet</p>
                  <p className="text-xs text-slate-600 dark:text-zinc-500 mt-1">
                    Buy a number below to receive OTPs here.
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {activeAssignments.map((a) => {
                    const otp = a.lastSms?.body ? extractOtp(a.lastSms.body) : null;
                    return (
                      <li
                        key={a.id}
                        className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/50 p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-mono text-sm font-semibold text-[#2D2D2D] dark:text-zinc-100">
                              {a.number}
                            </p>
                            <p className="text-[11px] text-slate-600 dark:text-zinc-400">{a.country}</p>
                            <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-700 dark:text-zinc-300">
                              <Clock className="w-3 h-3 shrink-0" />
                              {a.expiresAt
                                ? `Expires in ${formatCountdown(a.expiresAt)}`
                                : "No expiry set"}
                            </div>
                          </div>
                          <Badge variant={a.server === "SERVER1" ? "info" : "success"} className="shrink-0 text-[10px]">
                            {a.server === "SERVER1" ? "🇺🇸 S1" : "🌍 S2"}
                          </Badge>
                        </div>
                        <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                          <div>
                            <p className="text-[10px] uppercase text-slate-500 dark:text-zinc-500 font-medium">
                              Latest OTP
                            </p>
                            <p className="text-lg font-bold tracking-wide text-violet-700 dark:text-violet-300 font-mono">
                              {otp ?? "—"}
                            </p>
                          </div>
                          {otp && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => void copyNumber(otp)}
                            >
                              Copy OTP
                            </Button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {activeServer === "SERVER2" && selectedService && numbers.length > 0 && (
            <Card
              id="abati-buy-inventory"
              className="w-full max-w-[354px] mx-auto lg:max-w-none rounded-2xl border border-zinc-200/90 dark:border-zinc-800 overflow-hidden mb-8"
            >
              <CardHeader className="pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <CardTitle className="text-[14px] font-semibold text-slate-900 dark:text-zinc-100">
                  Available numbers
                </CardTitle>
                <p className="text-[11px] text-slate-600 dark:text-zinc-400">Tap a row to purchase</p>
              </CardHeader>
              <CardContent className="p-0">
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
                        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-violet-50/60 dark:hover:bg-violet-950/20 transition-colors border-b border-zinc-100 dark:border-zinc-900 last:border-0 sm:odd:border-r sm:border-zinc-100 dark:sm:border-zinc-900"
                      >
                        <div className="text-lg flex-shrink-0">{SERVER_INFO[activeServer].icon}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-mono font-semibold text-[#2D2D2D] dark:text-zinc-100">
                            {n.number}
                          </p>
                          <p className="text-[10px] text-slate-600 dark:text-zinc-500">{n.country}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[12px] font-semibold text-violet-600 dark:text-violet-300">
                            ₦
                            {finalNumberPurchasePriceNGN(n.priceNGN, {
                              server: "SERVER2",
                              carrier: "any",
                              areaCodesRaw: "",
                              premiumRate: selectedPremiumRate,
                            }).toLocaleString()}
                          </p>
                          <p className="text-[10px] text-zinc-500">${n.priceUSD.toFixed(2)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void copyNumber(n.number);
                          }}
                          className="p-1.5 rounded-lg hover:bg-violet-100/80 dark:hover:bg-violet-900/30 transition-colors text-zinc-400"
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
              </CardContent>
            </Card>
          )}

          <div className="w-full max-w-[354px] mx-auto lg:max-w-none rounded-2xl border border-violet-200/70 dark:border-violet-900/50 bg-[#F3F0FF] dark:bg-violet-950/30 px-4 py-4 mb-8 shadow-sm">
            <h3 className="text-sm font-semibold text-[#2D2D2D] dark:text-zinc-100 mb-3">How it works</h3>
            <ul className="space-y-2.5">
              {HOW_IT_WORKS_RULES.map((rule) => (
                <li
                  key={rule}
                  className="flex gap-2.5 text-[13px] leading-snug text-[#2D2D2D] dark:text-zinc-100"
                >
                  <CheckCircle2
                    className="w-4 h-4 flex-shrink-0 text-violet-700 dark:text-violet-400 mt-0.5"
                    aria-hidden
                  />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {/* Purchase dialog */}
      <Dialog
        open={!!selected}
        onOpenChange={(o) => {
          if (!o) {
            setSelected(null);
            setPurchaseLegalAccepted(false);
          }
        }}
      >
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
                  <span className="font-medium">Base</span>
                  <span className="text-muted-foreground">
                    ₦{Math.round(getPurchaseChargeBase(selected)).toLocaleString()}
                  </span>
                </div>
                {getPurchasePriceNGN(selected) > Math.round(getPurchaseChargeBase(selected)) && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-amber-500">Premium price</span>
                    <span className="font-medium text-amber-500">
                      +₦
                      {(
                        getPurchasePriceNGN(selected) - Math.round(getPurchaseChargeBase(selected))
                      ).toLocaleString()}{" "}
                      ({premiumPercentLabel}%)
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm border-t border-border/30 pt-2">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-primary text-base">
                    ₦{getPurchasePriceNGN(selected).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm p-3 rounded-xl bg-primary/5 border border-primary/20">
                <span className="text-muted-foreground">Wallet Balance After</span>
                <span
                  className={`font-semibold ${
                    walletBalance < getPurchaseWalletDebit(selected)
                      ? "text-destructive"
                      : "text-emerald-400"
                  }`}
                >
                  {formatCurrency(
                    Math.max(0, walletBalance - getPurchaseWalletDebit(selected)),
                    walletCurrency
                  )}
                </span>
              </div>

              {walletBalance < getPurchaseWalletDebit(selected) && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  Insufficient balance. Please top up your wallet first.
                </div>
              )}

              <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border/60 bg-muted/30 p-3 text-xs leading-snug text-muted-foreground">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 shrink-0 rounded border-input accent-primary"
                  checked={purchaseLegalAccepted}
                  onChange={(e) => setPurchaseLegalAccepted(e.target.checked)}
                />
                <span>
                  I agree to the{" "}
                  <Link href="/terms" className="font-medium text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="font-medium text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
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
                !purchaseLegalAccepted ||
                walletBalance < getPurchaseWalletDebit(selected)
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
