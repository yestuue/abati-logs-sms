"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Package, Copy, Check, Search, X, ShoppingBag,
  ExternalLink, Clock, Filter,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Order {
  id: string;
  product: string;
  category: "Facebook" | "Instagram" | "TikTok" | "Twitter/X" | "Gmail" | "Other";
  username: string;
  password: string;
  recoveryEmail?: string;
  twoFAKey?: string;
  price: number;
  date: string;
  status: "delivered" | "pending";
}

// ── Mock vault data — replace with real API in production ─────────────────────
const MOCK_ORDERS: Order[] = [
  {
    id: "ord-001",
    product: "HQ Facebook Aged Account",
    category: "Facebook",
    username: "john.d.usa2019",
    password: "Fb@Secure!99",
    recoveryEmail: "jd2019recovery@gmail.com",
    twoFAKey: "JBSWY3DPEHPK3PXP",
    price: 1200,
    date: "Apr 2, 2026",
    status: "delivered",
  },
  {
    id: "ord-002",
    product: "Instagram 500+ Followers",
    category: "Instagram",
    username: "insta_fresh_uk",
    password: "Insta#2024!",
    recoveryEmail: "ukaccount@proton.me",
    price: 1800,
    date: "Apr 1, 2026",
    status: "delivered",
  },
  {
    id: "ord-003",
    product: "USA Gmail PVA",
    category: "Gmail",
    username: "usadev.account2023@gmail.com",
    password: "Gm@ilPass#55",
    price: 600,
    date: "Mar 30, 2026",
    status: "delivered",
  },
  {
    id: "ord-004",
    product: "TikTok 1K Followers",
    category: "TikTok",
    username: "tiktok_verified_ng",
    password: "Tik!T0k@2025",
    twoFAKey: "MFRGGZDFMZTWQ2LK",
    price: 2200,
    date: "Mar 28, 2026",
    status: "delivered",
  },
  {
    id: "ord-005",
    product: "Twitter/X Aged Account",
    category: "Twitter/X",
    username: "@dgtl_pioneer_2020",
    password: "Tw1tter#Aged",
    recoveryEmail: "pioneer2020alt@yahoo.com",
    price: 900,
    date: "Mar 25, 2026",
    status: "delivered",
  },
];

const CATEGORY_ICONS: Record<Order["category"], string> = {
  Facebook: "📘", Instagram: "📸", TikTok: "🎵",
  "Twitter/X": "🐦", Gmail: "📧", Other: "🔗",
};

const MINT      = "oklch(0.80 0.19 162)";
const MINT_DARK = "oklch(0.68 0.17 162)";

// ── Copy button with tick feedback ───────────────────────────────────────────
function CopyBtn({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      toast.success(`${label} copied!`);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={handleCopy}
      title={`Copy ${label}`}
      className="flex-shrink-0 p-1.5 rounded-lg transition-all hover:scale-110"
      style={{ background: copied ? `${MINT}20` : "var(--muted)", color: copied ? MINT : "var(--muted-foreground)" }}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

// ── Credential row ────────────────────────────────────────────────────────────
function CredRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground w-16 flex-shrink-0">
        {label}
      </span>
      <code
        className="flex-1 text-xs font-mono truncate px-2 py-0.5 rounded"
        style={{ background: "var(--accent)", color: "var(--foreground)" }}
      >
        {value}
      </code>
      <CopyBtn value={value} label={label} />
    </div>
  );
}

// ── Order Card ────────────────────────────────────────────────────────────────
function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);

  function copyAll() {
    const lines = [
      `Product: ${order.product}`,
      `Username: ${order.username}`,
      `Password: ${order.password}`,
      order.recoveryEmail ? `Recovery Email: ${order.recoveryEmail}` : null,
      order.twoFAKey ? `2FA Key: ${order.twoFAKey}` : null,
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(lines).then(() => toast.success("All credentials copied!"));
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card style={{ border: "1px solid var(--border)" }}>
        {/* Top color band */}
        <div className="h-0.5 rounded-t-xl" style={{ background: `linear-gradient(90deg, ${MINT}, ${MINT_DARK})` }} />

        <CardContent className="p-4 space-y-3">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xl flex-shrink-0">{CATEGORY_ICONS[order.category]}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{order.product}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="w-2.5 h-2.5" />{order.date}
                  </span>
                  <span className="text-[10px] font-bold" style={{ color: MINT }}>
                    ₦{order.price.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge
                variant="secondary"
                className="text-[10px]"
                style={order.status === "delivered"
                  ? { background: `${MINT}18`, color: MINT, border: `1px solid ${MINT}28` }
                  : {}}
              >
                {order.status === "delivered" ? "✓ Delivered" : "Pending"}
              </Badge>
              <button
                onClick={() => setExpanded((p) => !p)}
                className="text-xs font-semibold transition-colors hover:text-foreground"
                style={{ color: MINT }}
              >
                {expanded ? "Hide" : "View"}
              </button>
            </div>
          </div>

          {/* Credentials — revealed when expanded */}
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 pt-2 border-t border-border/50"
            >
              <CredRow label="Username" value={order.username} />
              <CredRow label="Password" value={order.password} />
              {order.recoveryEmail && <CredRow label="Recovery" value={order.recoveryEmail} />}
              {order.twoFAKey      && <CredRow label="2FA Key"  value={order.twoFAKey} />}

              <button
                onClick={copyAll}
                className="mt-1 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                style={{ background: `${MINT}14`, color: MINT, border: `1px solid ${MINT}28` }}
              >
                <Copy className="w-3.5 h-3.5" />
                Copy All Credentials
              </button>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const [search, setSearch]         = useState("");
  const [filter, setFilter]         = useState<Order["category"] | "All">("All");

  const categories = ["All", "Facebook", "Instagram", "TikTok", "Twitter/X", "Gmail", "Other"] as const;

  const filtered = MOCK_ORDERS.filter((o) => {
    const matchCat    = filter === "All" || o.category === filter;
    const matchSearch = o.product.toLowerCase().includes(search.toLowerCase()) ||
                        o.username.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const totalSpent = MOCK_ORDERS.reduce((s, o) => s + o.price, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
          My Vault
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Your purchased social log credentials — keep these private.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Orders",   value: MOCK_ORDERS.length,                      icon: Package },
          { label: "Delivered",      value: MOCK_ORDERS.filter((o) => o.status === "delivered").length, icon: Check },
          { label: "Total Spent",    value: `₦${totalSpent.toLocaleString()}`,        icon: ShoppingBag },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                  <p className="text-xl font-bold mt-1" style={{ fontFamily: "var(--font-heading)" }}>{s.value}</p>
                </div>
                <div className="p-2 rounded-xl" style={{ background: `${MINT}14` }}>
                  <Icon className="w-4 h-4" style={{ color: MINT }} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search + Category filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by product or username…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as Order["category"] | "All")}
            className="pl-9 pr-8 py-2 rounded-xl border text-sm font-medium appearance-none cursor-pointer"
            style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)", minWidth: 160 }}
          >
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <ExternalLink className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none opacity-0" />
        </div>
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingBag className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-foreground">No orders found</p>
          <p className="text-sm text-muted-foreground mt-1">
            {MOCK_ORDERS.length === 0
              ? "You haven't purchased any logs yet."
              : "Try adjusting your search or filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => <OrderCard key={order.id} order={order} />)}
        </div>
      )}

      {/* Security notice */}
      <Card style={{ background: "oklch(0.53 0.22 27 / 0.06)", border: "1px solid oklch(0.53 0.22 27 / 0.22)" }}>
        <CardHeader className="pb-1 pt-4 px-4">
          <CardTitle className="text-sm text-destructive flex items-center gap-2">
            🔒 Security Notice
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Never share your credentials publicly. Store passwords in a secure password manager.
            Abati Digital is not responsible for account loss due to misuse or sharing of credentials.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
