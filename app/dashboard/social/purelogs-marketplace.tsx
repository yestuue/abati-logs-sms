"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Check, ExternalLink, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Product = {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  available: number;
  status?: "IN_STOCK" | "OUT_OF_STOCK";
};

type LogItem = {
  id: string;
  data: string;
  url: string;
  price: number;
};

function formatNgn(value: number): string {
  return `₦${Math.ceil(value).toLocaleString()}`;
}

export function PurelogsMarketplace() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [items, setItems] = useState<LogItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/marketplace/products", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load marketplace");
        setProducts((data.products ?? []) as Product[]);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load marketplace");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function openProduct(product: Product) {
    if (product.status === "OUT_OF_STOCK" || product.available <= 0) {
      setSelectedProduct(product);
      setSelectedIds(new Set());
      setItems([]);
      toast.error("Out of Stock");
      return;
    }
    setSelectedProduct(product);
    setSelectedIds(new Set());
    setItems([]);
    setItemsLoading(true);
    try {
      const res = await fetch(`/api/marketplace/products/${encodeURIComponent(product.slug)}/items`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load product items");
      setItems((data.items ?? []) as LogItem[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load product items");
    } finally {
      setItemsLoading(false);
    }
  }

  function toggleSelect(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function copyToClipboard(value: string) {
    void navigator.clipboard.writeText(value);
    toast.success("Copied");
  }

  async function buySelected() {
    if (selectedIds.size === 0) {
      toast.error("Select at least one account");
      return;
    }
    setBuying(true);
    try {
      const res = await fetch("/api/marketplace/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds: Array.from(selectedIds) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Purchase failed");
      toast.success(`Purchased ${data.purchased} account(s) for ${formatNgn(data.total)}`);
      if (selectedProduct) await openProduct(selectedProduct);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Purchase failed");
    } finally {
      setBuying(false);
    }
  }

  const visibleProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }, [products, search]);

  const selectedTotal = useMemo(() => {
    const selected = items.filter((i) => selectedIds.has(i.id));
    return selected.reduce((sum, i) => sum + i.price, 0);
  }, [items, selectedIds]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Marketplace</h1>
        <p className="text-sm text-muted-foreground">Purelogs-style selection with verified account previews.</p>
      </div>

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search products..."
        className="max-w-xl"
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading products...</p>
      ) : visibleProducts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No products available.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleProducts.map((product) => (
            <Card
              key={product.id}
              className={`bg-white border border-zinc-200 shadow-sm transition-colors ${
                product.status === "OUT_OF_STOCK" || product.available <= 0
                  ? "opacity-70 cursor-not-allowed"
                  : "cursor-pointer hover:border-blue-300"
              }`}
              onClick={() => void openProduct(product)}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-zinc-100 flex items-center justify-center text-lg">🔐</div>
                  <div className="min-w-0">
                    <p className="font-bold text-zinc-900 truncate">{product.title}</p>
                    <p className="text-xs text-zinc-500">{product.available} available</p>
                  </div>
                </div>

                <div className="rounded-lg bg-zinc-100 p-3">
                  <p className="text-xs font-semibold text-zinc-700 mb-1">Rules / Note</p>
                  <p className="text-xs text-zinc-600 leading-relaxed">{product.description}</p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <Badge className="bg-blue-600 text-white hover:bg-blue-600">{formatNgn(product.price)}</Badge>
                  {product.status === "OUT_OF_STOCK" || product.available <= 0 ? (
                    <Badge variant="destructive">Out of Stock</Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-zinc-100 text-zinc-700 border border-zinc-200">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      Admin Verified
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedProduct && (
        <Card className="border border-zinc-200 bg-white">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-zinc-900">{selectedProduct.title}</p>
                <p className="text-xs text-zinc-500">{items.length} Available</p>
              </div>
              <Badge variant="secondary" className="bg-zinc-100 text-zinc-700 border border-zinc-200">
                Admin Verified
              </Badge>
            </div>

            {itemsLoading ? (
              <p className="text-sm text-muted-foreground">Loading profile URLs...</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No available profiles found.</p>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 border rounded-md bg-white border-zinc-200"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        className="w-4 h-4"
                        checked={selectedIds.has(item.id)}
                        onChange={(e) => toggleSelect(item.id, e.target.checked)}
                      />
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 text-sm truncate max-w-[320px] inline-flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {item.data}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <button onClick={() => copyToClipboard(item.data)} className="p-1 rounded hover:bg-zinc-100">
                      <Copy className="w-4 h-4 text-zinc-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-md bg-zinc-100 px-3 py-2 text-sm text-zinc-700">
              Selected: {selectedIds.size} | Total: {formatNgn(selectedTotal)}
            </div>

            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              disabled={
                buying ||
                selectedIds.size === 0 ||
                selectedProduct.status === "OUT_OF_STOCK" ||
                selectedProduct.available <= 0
              }
              onClick={() => void buySelected()}
            >
              {selectedProduct.status === "OUT_OF_STOCK" || selectedProduct.available <= 0
                ? "Out of Stock"
                : buying
                  ? "Processing..."
                  : "Buy Now"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
