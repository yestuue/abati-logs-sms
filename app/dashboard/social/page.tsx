"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Filter, ShoppingBag, Star, Package, X,
  ChevronDown, AlertCircle, Loader2, Check, Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import Link from "next/link";
import Image from "next/image";
import { CATEGORY_GROUPS, type CategoryGroup } from "@/lib/categories";
import { getServiceLogo, getServiceEmoji } from "@/lib/service-logos";

type Category = "All" | "Facebook" | "Instagram" | "TikTok" | "Twitter/X" | "Gmail" | "Texting Apps" | "VPN" | "Other";
type SortKey  = "newest" | "price-low" | "price-high" | "most-stock";

interface Product {
  id: string; title: string; description: string;
  category: Category; price: number; stock: number;
  rating: number; badge?: string;
}

const PRODUCTS: Product[] = [
  { id: "p1",  title: "HQ Facebook Aged Accounts",   description: "2018–2022 aged accounts, verified email, profile photo.",           category: "Facebook",  price: 1200, stock: 47,  rating: 4.8, badge: "Hot" },
  { id: "p2",  title: "Facebook Fresh Accounts",      description: "New phone-verified accounts, ready for business use.",              category: "Facebook",  price: 450,  stock: 120, rating: 4.2 },
  { id: "p3",  title: "Instagram 500+ Followers",     description: "Real-looking accounts with 500+ followers, business-ready.",        category: "Instagram", price: 1800, stock: 23,  rating: 4.9, badge: "Top Rated" },
  { id: "p4",  title: "Instagram Verified-Email",      description: "Email & phone verified, profile completed.",                        category: "Instagram", price: 750,  stock: 85,  rating: 4.5 },
  { id: "p5",  title: "TikTok 1K Followers",          description: "Established TikTok accounts with 1000+ followers.",                 category: "TikTok",    price: 2200, stock: 15,  rating: 4.7, badge: "Premium" },
  { id: "p6",  title: "TikTok Fresh Starter",         description: "Clean TikTok accounts, phone verified, ready to use.",              category: "TikTok",    price: 550,  stock: 60,  rating: 4.1 },
  { id: "p7",  title: "Twitter/X Verified Legacy",    description: "Legacy verified accounts with blue checkmarks, high followers.",   category: "Twitter/X", price: 3500, stock: 8,   rating: 5.0, badge: "Rare" },
  { id: "p8",  title: "Twitter/X Aged Accounts",      description: "2019–2021 aged accounts with tweet history.",                       category: "Twitter/X", price: 900,  stock: 40,  rating: 4.4 },
  { id: "p9",  title: "USA Gmail Accounts",           description: "US-based Gmail with phone verification.",                           category: "Gmail",     price: 600,  stock: 200, rating: 4.3 },
  { id: "p10", title: "UK Gmail PVA",                 description: "Phone verified UK Gmail accounts, full access.",                    category: "Gmail",     price: 700,  stock: 90,  rating: 4.6 },
  { id: "p11", title: "LinkedIn Sales Navigator",     description: "Aged LinkedIn with Sales Nav, 500+ connections.",                   category: "Other",        price: 4500, stock: 5,   rating: 4.9, badge: "Hot" },
  { id: "p12", title: "Snapchat Verified Accounts",   description: "Phone-verified Snapchat accounts ready for outreach.",              category: "Other",        price: 800,  stock: 35,  rating: 4.2 },
  // Texting Apps
  { id: "p13", title: "Google Voice Accounts",        description: "US Google Voice numbers, full SMS & call access.",                  category: "Texting Apps", price: 950,  stock: 60,  rating: 4.6, badge: "Popular" },
  { id: "p14", title: "TextNow Accounts",             description: "Active TextNow accounts with US numbers, email verified.",          category: "Texting Apps", price: 500,  stock: 110, rating: 4.3 },
  { id: "p15", title: "Talkatone Accounts",           description: "Phone-verified Talkatone with US number, ready to use.",            category: "Texting Apps", price: 450,  stock: 75,  rating: 4.1 },
  { id: "p16", title: "TextPlus Accounts",            description: "Verified TextPlus accounts with dedicated US/CA numbers.",          category: "Texting Apps", price: 420,  stock: 90,  rating: 4.0 },
  { id: "p17", title: "NextPlus Accounts",            description: "NextPlus with US virtual number, SMS-ready, full access.",          category: "Texting Apps", price: 430,  stock: 55,  rating: 4.2 },
  // VPN Services
  { id: "p18", title: "NordVPN Premium",              description: "1-year NordVPN subscription, multi-device, all servers.",           category: "VPN",          price: 3200, stock: 20,  rating: 4.9, badge: "Top Rated" },
  { id: "p19", title: "ExpressVPN 1-Year",            description: "Full ExpressVPN access, 94 countries, no-logs policy.",             category: "VPN",          price: 3800, stock: 18,  rating: 4.8 },
  { id: "p20", title: "Surfshark Unlimited",          description: "Unlimited devices, Surfshark CleanWeb, 100+ countries.",            category: "VPN",          price: 2400, stock: 30,  rating: 4.7, badge: "Hot" },
  { id: "p21", title: "PIA (Private Internet Access)", description: "10 simultaneous connections, kill switch, no-log VPN.",            category: "VPN",          price: 2200, stock: 25,  rating: 4.5 },
  { id: "p22", title: "HMA VPN",                     description: "HMA Premium with IP Shuffle, works with streaming platforms.",       category: "VPN",          price: 1900, stock: 40,  rating: 4.3 },
  { id: "p23", title: "CyberGhost VPN",               description: "7 simultaneous connections, dedicated streaming servers.",          category: "VPN",          price: 2100, stock: 35,  rating: 4.4 },
];

const CATEGORIES: Category[] = ["All", "Facebook", "Instagram", "TikTok", "Twitter/X", "Gmail", "Texting Apps", "VPN", "Other"];
const ICONS: Record<Category, string> = { All: "🌐", Facebook: "📘", Instagram: "📸", TikTok: "🎵", "Twitter/X": "🐦", Gmail: "📧", "Texting Apps": "💬", VPN: "🔒", Other: "🔗" };
const COLORS: Record<Category, string> = {
  All:           "oklch(0.80 0.19 162)",
  Facebook:      "oklch(0.55 0.18 240)",
  Instagram:     "oklch(0.62 0.22 345)",
  TikTok:        "oklch(0.52 0.20 20)",
  "Twitter/X":   "oklch(0.62 0.16 220)",
  Gmail:         "oklch(0.58 0.22 27)",
  "Texting Apps":"oklch(0.62 0.18 190)",
  VPN:           "oklch(0.58 0.20 260)",
  Other:         "oklch(0.65 0.16 280)",
};
const MINT      = "oklch(0.80 0.19 162)";
const MINT_DARK = "oklch(0.68 0.17 162)";
const MINT_BTN  = { background: `linear-gradient(135deg, ${MINT}, ${MINT_DARK})`, color: "#09090d", fontWeight: 700 };

const fmt = (n: number) => `₦${n.toLocaleString()}`;

function BuyModal({ product, walletBalance, onClose }: { product: Product; walletBalance: number; onClose: () => void }) {
  const [loading, setLoading]     = useState(false);
  const [purchased, setPurchased] = useState(false);
  const insufficient = walletBalance < product.price;

  async function handleBuy() {
    if (insufficient) { toast.error("Insufficient balance.", { description: `You need ${fmt(product.price - walletBalance)} more.` }); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1800));
    setLoading(false); setPurchased(true);
    toast.success("Purchase successful!", { description: "Credentials saved to your Vault." });
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" style={{ color: MINT }} />Confirm Purchase
          </DialogTitle>
          <DialogDescription>Review the details before confirming</DialogDescription>
        </DialogHeader>

        {purchased ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6 space-y-3">
            <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center" style={{ background: `${MINT}20` }}>
              <Check className="w-7 h-7" style={{ color: MINT }} />
            </div>
            <p className="font-bold text-lg">Purchase Complete!</p>
            <p className="text-sm text-muted-foreground">Credentials are now in your Vault.</p>
            <div className="flex gap-2 justify-center mt-2">
              <Button style={MINT_BTN} onClick={onClose}>Done</Button>
              <Button variant="outline" asChild><Link href="/dashboard/orders" onClick={onClose}>View Vault</Link></Button>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-xl space-y-2" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
              <p className="font-semibold text-sm">{product.title}</p>
              <p className="text-xs text-muted-foreground">{product.description}</p>
              <div className="flex justify-between pt-1">
                <span className="text-xs text-muted-foreground">Unit Price</span>
                <span className="font-bold" style={{ color: MINT }}>{fmt(product.price)}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl flex items-start gap-3" style={
              insufficient
                ? { background: "oklch(0.53 0.22 27 / 0.08)", border: "1px solid oklch(0.53 0.22 27 / 0.28)" }
                : { background: `${MINT}10`, border: `1px solid ${MINT}28` }
            }>
              {insufficient
                ? <AlertCircle className="w-4 h-4 mt-0.5 text-red-400 flex-shrink-0" />
                : <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: MINT }} />}
              <div className="text-xs">
                <p className="font-medium">Wallet: {fmt(walletBalance)}</p>
                {insufficient
                  ? <p className="text-red-400 mt-0.5">Need {fmt(product.price - walletBalance)} more. <Link href="/dashboard/wallet" className="underline font-semibold" onClick={onClose}>Fund Wallet →</Link></p>
                  : <p className="text-muted-foreground mt-0.5">After purchase: {fmt(walletBalance - product.price)}</p>}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>Cancel</Button>
              <Button className="flex-1" style={insufficient ? { background: "var(--muted)", color: "var(--muted-foreground)", cursor: "not-allowed" } : MINT_BTN}
                onClick={handleBuy} disabled={loading || insufficient}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</> : insufficient ? "Insufficient Balance" : `Buy for ${fmt(product.price)}`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ServiceLogo({ name, size = 40 }: { name: string; size?: number }) {
  const logo    = getServiceLogo(name);
  const emoji   = getServiceEmoji(name);
  const [failed, setFailed] = useState(false);

  if (logo && !failed) {
    return (
      <Image
        src={logo}
        alt={name}
        width={size}
        height={size}
        onError={() => setFailed(true)}
        className="rounded-xl object-cover flex-shrink-0"
        style={{ width: size, height: size }}
        unoptimized
      />
    );
  }

  return (
    <div
      className="rounded-xl flex items-center justify-center text-xl flex-shrink-0"
      style={{ width: size, height: size, background: "var(--muted)", border: "1px solid var(--border)" }}
    >
      {emoji}
    </div>
  );
}

function ProductCard({ product, onBuy }: { product: Product; onBuy: (p: Product) => void }) {
  const accent      = COLORS[product.category];
  const outOfStock  = product.stock === 0;
  const [showPrice, setShowPrice] = useState(false);

  // Derive the service name from the title for logo lookup
  const serviceKey = product.title.split(" ")[0];

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.25 }}>
      <Card className="h-full flex flex-col overflow-hidden hover:scale-[1.01] transition-all duration-200" style={{ border: "1px solid var(--border)" }}>
        <div className="h-1" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}88)` }} />
        <CardContent className="p-4 flex flex-col flex-1 gap-3">
          <div className="flex items-start gap-3">
            <ServiceLogo name={serviceKey} size={40} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                {product.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: `${accent}22`, color: accent }}>{product.badge}</span>
                )}
              </div>
              <p className="text-sm font-semibold text-foreground leading-snug">{product.title}</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground flex-1 line-clamp-2">{product.description}</p>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{product.rating}</span>
            <span className="flex items-center gap-1"><Package className="w-3 h-3" />{outOfStock ? "Out of stock" : `${product.stock} in stock`}</span>
          </div>

          <div className="pt-2 border-t border-border/50 space-y-2">
            {/* Price — hidden until "Check Price" is clicked */}
            <div
              className="flex items-center justify-center rounded-xl py-2 cursor-pointer transition-all"
              style={showPrice
                ? { background: `${accent}12`, border: `1px solid ${accent}28` }
                : { background: "var(--muted)", border: "1px solid var(--border)" }}
              onClick={() => { if (!showPrice) setShowPrice(true); }}
            >
              {showPrice ? (
                <span className="font-extrabold text-base" style={{ color: accent, fontFamily: "var(--font-heading)" }}>
                  {fmt(product.price)}
                </span>
              ) : (
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  👁 Check Price
                </span>
              )}
            </div>

            <Button
              size="sm"
              className="w-full"
              disabled={outOfStock || !showPrice}
              onClick={() => onBuy(product)}
              style={outOfStock || !showPrice
                ? { background: "var(--muted)", color: "var(--muted-foreground)" }
                : { ...MINT_BTN, boxShadow: `0 2px 8px ${MINT}40` }}
            >
              {outOfStock ? "Sold Out" : showPrice ? "Buy Now" : "Select Service"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function SocialLogsPage() {
  const [search, setSearch]       = useState("");
  const [category, setCategory]   = useState<Category>("All");
  const [sort, setSort]           = useState<SortKey>("newest");
  const [buyTarget, setBuyTarget] = useState<Product | null>(null);
  const WALLET_BALANCE = 850;

  const filtered = PRODUCTS
    .filter((p) => (category === "All" || p.category === category) &&
      (p.title.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) =>
      sort === "price-low" ? a.price - b.price :
      sort === "price-high" ? b.price - a.price :
      sort === "most-stock" ? b.stock - a.stock : 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>Social Logs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Premium account marketplace — {PRODUCTS.length} products</p>
        </div>
        <Link href="/dashboard/wallet"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold self-start sm:self-auto hover:opacity-80 transition-all"
          style={{ background: `${MINT}14`, border: `1px solid ${MINT}30`, color: MINT }}>
          <Wallet className="w-4 h-4" />Balance: ₦{WALLET_BALANCE.toLocaleString()}
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>}
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
            className="pl-9 pr-8 py-2 rounded-xl border text-sm font-medium appearance-none cursor-pointer"
            style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)", minWidth: 170 }}>
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low → High</option>
            <option value="price-high">Price: High → Low</option>
            <option value="most-stock">Most Stock</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => {
          const active = category === cat;
          const color  = COLORS[cat];
          return (
            <button key={cat} onClick={() => setCategory(cat)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
              style={active
                ? { background: `linear-gradient(135deg, ${color}, ${color}cc)`, color: "#09090d", boxShadow: `0 2px 8px ${color}40` }
                : { background: "var(--accent)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}>
              <span>{ICONS[cat]}</span>{cat}
              {cat !== "All" && (
                <Badge variant="secondary" className="ml-0.5 text-[10px] px-1 py-0" style={active ? { background: "rgba(0,0,0,0.20)", color: "#09090d" } : {}}>
                  {PRODUCTS.filter((p) => p.category === cat).length}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold">No products found</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
        </div>
      ) : category === "All" && !search ? (
        // Grouped view — only when browsing all with no search query
        <div className="space-y-10">
          {(Object.entries(CATEGORY_GROUPS) as [CategoryGroup, { icon: string; categories: readonly string[] }][]).map(([groupName, group]) => {
            const groupProducts = filtered.filter((p) =>
              group.categories.includes(p.category as never) ||
              // Map page categories to group categories
              (groupName === "Social Logs" && ["Facebook", "Instagram", "Twitter/X", "TikTok", "Gmail", "Other"].includes(p.category)) ||
              (groupName === "Texting Apps" && p.category === "Texting Apps") ||
              (groupName === "VPN Services" && p.category === "VPN")
            );
            if (groupProducts.length === 0) return null;
            return (
              <div key={groupName}>
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border/50">
                  <span className="text-xl">{group.icon}</span>
                  <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
                    {groupName}
                  </h2>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: `${MINT}14`, color: MINT, border: `1px solid ${MINT}28` }}
                  >
                    {groupProducts.length} products
                  </span>
                </div>
                <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  <AnimatePresence mode="popLayout">
                    {groupProducts.map((p) => <ProductCard key={p.id} product={p} onBuy={setBuyTarget} />)}
                  </AnimatePresence>
                </motion.div>
              </div>
            );
          })}
        </div>
      ) : (
        // Flat grid — when a specific category is selected or search is active
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((p) => <ProductCard key={p.id} product={p} onBuy={setBuyTarget} />)}
          </AnimatePresence>
        </motion.div>
      )}

      {buyTarget && <BuyModal product={buyTarget} walletBalance={WALLET_BALANCE} onClose={() => setBuyTarget(null)} />}
    </div>
  );
}
