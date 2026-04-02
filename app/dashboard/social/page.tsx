"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Filter, ShoppingBag, Star, Package, X,
  ChevronDown, AlertCircle, Loader2, Check,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

// ── Types ─────────────────────────────────────────────────────────────────────
type Category = "All" | "Facebook" | "Instagram" | "TikTok" | "Twitter/X" | "Gmail" | "Other";
type SortKey  = "newest" | "price-low" | "price-high" | "most-stock";

interface Product {
  id: string;
  title: string;
  description: string;
  category: Category;
  price: number;
  stock: number;
  rating: number;
  badge?: string;
}

// ── Mock product data ──────────────────────────────────────────────────────────
const PRODUCTS: Product[] = [
  { id: "p1",  title: "HQ Facebook Aged Accounts",    description: "2018–2022 aged accounts, verified email, profile photo. Great for ad campaigns.", category: "Facebook",  price: 1200, stock: 47, rating: 4.8, badge: "Hot" },
  { id: "p2",  title: "Facebook Fresh Accounts",      description: "New phone-verified accounts, ready for business use.", category: "Facebook",  price: 450,  stock: 120, rating: 4.2 },
  { id: "p3",  title: "Instagram 500+ Followers",     description: "Real-looking accounts with 500+ followers, business-ready.", category: "Instagram", price: 1800, stock: 23, rating: 4.9, badge: "Top Rated" },
  { id: "p4",  title: "Instagram Verified-Email",     description: "Email & phone verified, profile completed.", category: "Instagram", price: 750,  stock: 85, rating: 4.5 },
  { id: "p5",  title: "TikTok 1K Followers",          description: "Established TikTok accounts with 1000+ followers and engagement history.", category: "TikTok",    price: 2200, stock: 15, rating: 4.7, badge: "Premium" },
  { id: "p6",  title: "TikTok Fresh Starter",         description: "Clean TikTok accounts, phone verified, ready to use.", category: "TikTok",    price: 550,  stock: 60, rating: 4.1 },
  { id: "p7",  title: "Twitter/X Verified Legacy",    description: "Legacy verified accounts with blue checkmarks, high follower count.", category: "Twitter/X",  price: 3500, stock: 8,  rating: 5.0, badge: "Rare" },
  { id: "p8",  title: "Twitter/X Aged Accounts",      description: "2019–2021 aged accounts with tweet history.", category: "Twitter/X",  price: 900,  stock: 40, rating: 4.4 },
  { id: "p9",  title: "USA Gmail Accounts",           description: "US-based Gmail with phone verification. Perfect for account creation.", category: "Gmail",     price: 600,  stock: 200, rating: 4.3 },
  { id: "p10", title: "UK Gmail PVA",                 description: "Phone verified UK Gmail accounts, full access.", category: "Gmail",     price: 700,  stock: 90, rating: 4.6 },
  { id: "p11", title: "LinkedIn Sales Navigator",     description: "Aged LinkedIn with Sales Nav access, connections 500+.", category: "Other",     price: 4500, stock: 5,  rating: 4.9, badge: "Hot" },
  { id: "p12", title: "Snapchat Verified Accounts",   description: "Phone-verified Snapchat accounts ready for outreach.", category: "Other",     price: 800,  stock: 35, rating: 4.2 },
];

const CATEGORIES: Category[] = ["All", "Facebook", "Instagram", "TikTok", "Twitter/X", "Gmail", "Other"];

const CATEGORY_ICONS: Record<Category, string> = {
  All:       "🌐",
  Facebook:  "📘",
  Instagram: "📸",
  TikTok:    "🎵",
  "Twitter/X": "🐦",
  Gmail:     "📧",
  Other:     "🔗",
};

const CATEGORY_COLORS: Record<Category, string> = {
  All:         "oklch(0.68 0.22 278)",
  Facebook:    "oklch(0.55 0.20 240)",
  Instagram:   "oklch(0.60 0.22 340)",
  TikTok:      "oklch(0.50 0.20 20)",
  "Twitter/X": "oklch(0.62 0.18 220)",
  Gmail:       "oklch(0.58 0.22 27)",
  Other:       "oklch(0.62 0.18 150)",
};

function formatPrice(n: number) {
  return `₦${n.toLocaleString()}`;
}

// ── Buy Modal ─────────────────────────────────────────────────────────────────
function BuyModal({
  product,
  walletBalance,
  onClose,
}: {
  product: Product;
  walletBalance: number;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const insufficient = walletBalance < product.price;

  async function handleBuy() {
    if (insufficient) {
      toast.error("Insufficient balance. Please fund your wallet first.", {
        description: `You need ${formatPrice(product.price - walletBalance)} more.`,
      });
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1800));
    setLoading(false);
    setPurchased(true);
    toast.success("Purchase successful!", { description: "Account credentials have been sent to your inbox." });
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" style={{ color: "var(--primary)" }} />
            Confirm Purchase
          </DialogTitle>
          <DialogDescription>Review the details before confirming</DialogDescription>
        </DialogHeader>

        {purchased ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6 space-y-3"
          >
            <div
              className="w-14 h-14 rounded-full mx-auto flex items-center justify-center"
              style={{ background: "oklch(0.68 0.22 278 / 0.16)" }}
            >
              <Check className="w-7 h-7" style={{ color: "var(--primary)" }} />
            </div>
            <p className="font-bold text-lg text-foreground">Purchase Complete!</p>
            <p className="text-sm text-muted-foreground">
              Your account credentials have been delivered. Check your SMS Inbox.
            </p>
            <Button
              className="w-full mt-2"
              style={{
                background: "linear-gradient(135deg, oklch(0.68 0.22 278), oklch(0.55 0.24 278))",
                color: "#fff",
              }}
              onClick={onClose}
            >
              Done
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {/* Product summary */}
            <div
              className="p-4 rounded-xl space-y-2"
              style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
            >
              <p className="font-semibold text-foreground text-sm">{product.title}</p>
              <p className="text-xs text-muted-foreground">{product.description}</p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-muted-foreground">Unit Price</span>
                <span className="font-bold" style={{ color: "var(--primary)" }}>
                  {formatPrice(product.price)}
                </span>
              </div>
            </div>

            {/* Balance check */}
            <div
              className="p-3 rounded-xl flex items-start gap-3"
              style={
                insufficient
                  ? { background: "oklch(0.53 0.22 27 / 0.08)", border: "1px solid oklch(0.53 0.22 27 / 0.28)" }
                  : { background: "oklch(0.68 0.22 278 / 0.08)", border: "1px solid oklch(0.68 0.22 278 / 0.22)" }
              }
            >
              {insufficient ? (
                <AlertCircle className="w-4 h-4 mt-0.5 text-red-400 flex-shrink-0" />
              ) : (
                <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--primary)" }} />
              )}
              <div className="text-xs">
                <p className="font-medium text-foreground">
                  Wallet Balance: {formatPrice(walletBalance)}
                </p>
                {insufficient ? (
                  <p className="text-red-400 mt-0.5">
                    You need {formatPrice(product.price - walletBalance)} more to complete this purchase.
                  </p>
                ) : (
                  <p className="text-muted-foreground mt-0.5">
                    After purchase: {formatPrice(walletBalance - product.price)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                className="flex-1 font-semibold"
                style={{
                  background: insufficient
                    ? "var(--muted)"
                    : "linear-gradient(135deg, oklch(0.68 0.22 278), oklch(0.55 0.24 278))",
                  color: insufficient ? "var(--muted-foreground)" : "#fff",
                  cursor: insufficient ? "not-allowed" : "pointer",
                }}
                onClick={handleBuy}
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                ) : insufficient ? (
                  "Fund Wallet"
                ) : (
                  `Buy for ${formatPrice(product.price)}`
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Product Card ──────────────────────────────────────────────────────────────
function ProductCard({
  product,
  onBuy,
}: {
  product: Product;
  onBuy: (p: Product) => void;
}) {
  const color = CATEGORY_COLORS[product.category];
  const outOfStock = product.stock === 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
    >
      <Card
        className="h-full flex flex-col overflow-hidden group transition-all duration-200 hover:scale-[1.01]"
        style={{ border: "1px solid var(--border)" }}
      >
        {/* Color band */}
        <div className="h-1" style={{ background: `linear-gradient(90deg, ${color}, ${color}80)` }} />

        <CardContent className="p-4 flex flex-col flex-1 gap-3">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-base">{CATEGORY_ICONS[product.category]}</span>
                {product.badge && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                    style={{ background: `${color}20`, color }}
                  >
                    {product.badge}
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-foreground leading-snug">{product.title}</p>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground flex-1 line-clamp-2">{product.description}</p>

          {/* Meta */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{product.rating}</span>
            </div>
            <div className="flex items-center gap-1">
              <Package className="w-3 h-3" />
              <span>{outOfStock ? "Out of stock" : `${product.stock} in stock`}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-1 border-t border-border/50">
            <span className="font-extrabold text-base" style={{ color, fontFamily: "var(--font-heading)" }}>
              {formatPrice(product.price)}
            </span>
            <Button
              size="sm"
              disabled={outOfStock}
              onClick={() => onBuy(product)}
              style={
                outOfStock
                  ? { background: "var(--muted)", color: "var(--muted-foreground)" }
                  : {
                      background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                      color: "#fff",
                      boxShadow: `0 2px 8px ${color}40`,
                    }
              }
              className="font-semibold text-xs"
            >
              {outOfStock ? "Sold Out" : "Buy Now"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SocialLogsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("All");
  const [sort, setSort] = useState<SortKey>("newest");
  const [buyTarget, setBuyTarget] = useState<Product | null>(null);
  // Simulated wallet balance — in production this comes from session/API
  const WALLET_BALANCE = 850;

  const filtered = PRODUCTS
    .filter((p) => {
      const matchCat = category === "All" || p.category === category;
      const matchSearch =
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    })
    .sort((a, b) => {
      if (sort === "price-low")  return a.price - b.price;
      if (sort === "price-high") return b.price - a.price;
      if (sort === "most-stock") return b.stock - a.stock;
      return 0; // newest — keep original order
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-extrabold text-foreground"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Social Logs
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Premium account marketplace — {PRODUCTS.length} products available
          </p>
        </div>
        {/* Wallet balance pill */}
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold self-start sm:self-auto"
          style={{
            background: "oklch(0.68 0.22 278 / 0.12)",
            border: "1px solid oklch(0.68 0.22 278 / 0.28)",
            color: "var(--primary)",
          }}
        >
          Balance: ₦{WALLET_BALANCE.toLocaleString()}
        </div>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="pl-9 pr-8 py-2 rounded-xl border text-sm font-medium appearance-none cursor-pointer"
            style={{
              background: "var(--card)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
              minWidth: 160,
            }}
          >
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low → High</option>
            <option value="price-high">Price: High → Low</option>
            <option value="most-stock">Most Stock</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => {
          const active = category === cat;
          const color = CATEGORY_COLORS[cat];
          return (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
              style={
                active
                  ? {
                      background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                      color: "#fff",
                      boxShadow: `0 2px 8px ${color}40`,
                    }
                  : {
                      background: "var(--accent)",
                      color: "var(--muted-foreground)",
                      border: "1px solid var(--border)",
                    }
              }
            >
              <span>{CATEGORY_ICONS[cat]}</span>
              {cat}
              {cat !== "All" && (
                <Badge
                  variant="secondary"
                  className="ml-0.5 text-[10px] px-1 py-0"
                  style={active ? { background: "rgba(255,255,255,0.25)", color: "#fff" } : {}}
                >
                  {PRODUCTS.filter((p) => p.category === cat).length}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* Products grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-foreground">No products found</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} onBuy={setBuyTarget} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Buy Modal */}
      {buyTarget && (
        <BuyModal
          product={buyTarget}
          walletBalance={WALLET_BALANCE}
          onClose={() => setBuyTarget(null)}
        />
      )}
    </div>
  );
}
