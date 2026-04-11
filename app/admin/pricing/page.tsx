"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Service = {
  id: string;
  serviceKey: string;
  name: string;
  basePrice: number;
  customPrice: number | null;
  premiumRate: number;
};

type ServerCfg = { server: "SERVER1" | "SERVER2"; isEnabled: boolean };
type CountryCfg = { slug: string; name: string; enabled: boolean; samplePrice?: number | null };
type LogCategory = { id: string; name: string; price: number; stock: number; enabled: boolean };
type LogItem = { id: string; category: string; username: string; price: number; status: string };

export default function AdminPricingPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [servers, setServers] = useState<ServerCfg[]>([]);
  const [countries, setCountries] = useState<CountryCfg[]>([]);
  const [globalPremiumPct, setGlobalPremiumPct] = useState("35");
  const [categories, setCategories] = useState<LogCategory[]>([]);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [newCategoryPrice, setNewCategoryPrice] = useState("");
  const [bulkPct, setBulkPct] = useState("");
  const [loading, setLoading] = useState(false);
  const [serviceDrafts, setServiceDrafts] = useState<Record<string, string>>({});
  const [serviceTableSearch, setServiceTableSearch] = useState("");

  async function loadServiceCatalog() {
    const res = await fetch("/api/admin/pricing", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to load service catalog");
    const list = (data.services ?? []) as Service[];
    setServices(list);
    setServiceDrafts(
      Object.fromEntries(list.map((s) => [s.id, String(Math.round(s.customPrice ?? s.basePrice))]))
    );
  }

  async function loadSms() {
    const res = await fetch("/api/admin/sms/update-price", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to load SMS pricing");
    setServers(data.servers ?? []);
    setCountries(data.countries ?? []);
    setGlobalPremiumPct(String(Math.round((Number(data.globalPremiumRate ?? 0.35) || 0.35) * 100)));
  }

  async function loadMarketplace() {
    const res = await fetch("/api/admin/marketplace/update-price", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to load marketplace pricing");
    setCategories(data.categories ?? []);
    setLogs(data.logs ?? []);
  }

  async function loadAll() {
    setLoading(true);
    try {
      await Promise.all([loadSms(), loadMarketplace(), loadServiceCatalog()]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load pricing data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  const filteredServices = useMemo(() => {
    const q = serviceTableSearch.trim().toLowerCase();
    if (!q) return services;
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.serviceKey.toLowerCase().includes(q)
    );
  }, [services, serviceTableSearch]);

  async function saveGlobalPremium() {
    const pct = Number(globalPremiumPct);
    const res = await fetch("/api/admin/sms/update-price", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "globalPremium", premiumRate: pct / 100 }),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error ?? "Global premium update failed");
    toast.success("Global premium updated");
    await Promise.all([loadSms(), loadServiceCatalog()]);
  }

  async function saveServiceCustomPrice(id: string, value: number) {
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter a valid positive price");
      return;
    }
    const res = await fetch("/api/admin/sms/update-price", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "servicePrice", serviceId: id, customPrice: value }),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error ?? "Service price update failed");
    const updated = data.service as Service;
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
    toast.success("Service price saved");
  }

  async function clearServiceCustomPrice(id: string) {
    const res = await fetch("/api/admin/sms/update-price", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "servicePrice", serviceId: id, customPrice: null }),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error ?? "Could not clear override");
    const updated = data.service as Service;
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
    setServiceDrafts((prev) => ({
      ...prev,
      [id]: String(Math.round(updated.basePrice)),
    }));
    toast.success("Using catalog base price");
  }

  async function syncSmsCatalog() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/pricing?syncCatalog=1", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Catalog sync failed");
      toast.success(`Catalog synced (${data.syncedKeys ?? 0} keys)`);
      await loadServiceCatalog();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setLoading(false);
    }
  }

  async function toggleServer(server: "SERVER1" | "SERVER2", isEnabled: boolean) {
    const res = await fetch("/api/admin/sms/update-price", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "toggleServer", server, isEnabled }),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error ?? "Server update failed");
    setServers((prev) => prev.map((s) => (s.server === server ? { ...s, isEnabled } : s)));
  }

  async function toggleCountry(slug: string, isEnabled: boolean) {
    const res = await fetch("/api/admin/sms/update-price", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "toggleCountry", countrySlug: slug, isEnabled }),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error ?? "Country update failed");
    setCountries((prev) => prev.map((c) => (c.slug === slug ? { ...c, isEnabled } : c)));
  }

  async function syncServer2Countries() {
    const res = await fetch("/api/admin/sms/update-price", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "syncServer2Countries" }),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error ?? "Country sync failed");
    toast.success(`Synced ${data.synced ?? 0} countries`);
    await loadSms();
  }

  async function createCategory() {
    const price = Number(newCategoryPrice);
    const res = await fetch("/api/admin/marketplace/update-price", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "createCategory", categoryName: newCategory, price }),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error ?? "Category create failed");
    setNewCategory("");
    setNewCategoryPrice("");
    setCategories((prev) => [data.category, ...prev]);
  }

  async function updateCategory(id: string, patch: Partial<Pick<LogCategory, "name" | "price" | "enabled">>) {
    const res = await fetch("/api/admin/marketplace/update-price", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "updateCategory", categoryId: id, categoryName: patch.name, price: patch.price, enabled: patch.enabled }),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error ?? "Category update failed");
    setCategories((prev) => prev.map((c) => (c.id === id ? data.category : c)));
  }

  async function deleteCategory(id: string) {
    const res = await fetch("/api/admin/marketplace/update-price", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deleteCategory", categoryId: id }),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error ?? "Category delete failed");
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  async function bulkAdjust() {
    const percent = Number(bulkPct);
    const res = await fetch("/api/admin/marketplace/update-price", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "bulkAdjust", percent }),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error ?? "Bulk edit failed");
    toast.success("Bulk edit applied");
    await loadMarketplace();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pricing Management</h1>
          <p className="text-sm text-muted-foreground">SMS Services and Marketplace Logs pricing controls.</p>
        </div>
        <Button variant="outline" onClick={() => void loadAll()} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>SMS Services</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label>Global Premium %</Label>
              <Input value={globalPremiumPct} onChange={(e) => setGlobalPremiumPct(e.target.value.replace(/[^\d.]/g, ""))} className="w-40" />
            </div>
            <Button onClick={() => void saveGlobalPremium()}>Save Global Premium</Button>
            <Button variant="outline" onClick={() => void syncServer2Countries()}>Fetch Server 2 Countries</Button>
            <Button variant="secondary" onClick={() => void syncSmsCatalog()} disabled={loading}>
              Sync SMS catalog (5SIM)
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {servers.map((s) => (
              <div key={s.server} className="flex items-center justify-between border border-border rounded-xl px-3 py-2">
                <span className="text-sm font-medium">{s.server}</span>
                <Button size="sm" variant={s.isEnabled ? "outline" : "default"} onClick={() => void toggleServer(s.server, !s.isEnabled)}>
                  {s.isEnabled ? "Disable" : "Enable"}
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Search services</Label>
            <Input
              placeholder="Filter by name or key (whatsapp, telegram…)"
              value={serviceTableSearch}
              onChange={(e) => setServiceTableSearch(e.target.value)}
              className="max-w-md h-9"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2">Service name</th>
                  <th className="text-left py-2">Current price (₦)</th>
                  <th className="text-right py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.map((s) => (
                  <tr key={s.id} className="border-b border-border/50">
                    <td className="py-2">
                      <div className="font-medium">{s.name}</div>
                      <div className="text-[11px] font-mono text-muted-foreground">{s.serviceKey}</div>
                      <div className="text-[11px] text-muted-foreground">
                        Catalog base: ₦{Math.round(s.basePrice).toLocaleString()}
                        {s.customPrice != null && (
                          <span className="ml-1 text-amber-600 dark:text-amber-400">(override active)</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 align-top">
                      <Input
                        value={serviceDrafts[s.id] ?? ""}
                        onChange={(e) =>
                          setServiceDrafts((prev) => ({
                            ...prev,
                            [s.id]: e.target.value.replace(/[^\d.]/g, ""),
                          }))
                        }
                        className="h-8 w-36"
                        aria-label={`Price for ${s.name}`}
                      />
                    </td>
                    <td className="py-2 text-right align-top space-x-2 whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          void saveServiceCustomPrice(s.id, Number(serviceDrafts[s.id]))
                        }
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground"
                        onClick={() => void clearServiceCustomPrice(s.id)}
                        disabled={s.customPrice == null}
                      >
                        Use catalog
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredServices.length === 0 && (
              <p className="text-sm text-muted-foreground py-4">
                {services.length === 0
                  ? "No services in database yet. Run “Sync SMS catalog” or use the user dashboard search to seed services."
                  : "No services match your search."}
              </p>
            )}
          </div>

          <div className="border border-border rounded-xl p-3">
            <p className="text-sm font-medium mb-2">Country toggles (Server 2)</p>
            <div className="max-h-56 overflow-auto space-y-2">
              {countries.map((c) => (
                <div key={c.slug} className="flex items-center justify-between text-sm">
                  <span>{c.name} ({c.slug}) {c.samplePrice ? `- ₦${Math.round(c.samplePrice).toLocaleString()}` : ""}</span>
                  <Button size="sm" variant={c.enabled ? "outline" : "default"} onClick={() => void toggleCountry(c.slug, !c.enabled)}>
                    {c.enabled ? "Disable" : "Enable"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Marketplace Logs</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1"><Label>New Category</Label><Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Facebook High Quality" /></div>
            <div className="space-y-1"><Label>Price</Label><Input value={newCategoryPrice} onChange={(e) => setNewCategoryPrice(e.target.value.replace(/[^\d.]/g, ""))} placeholder="3500" /></div>
            <Button onClick={() => void createCategory()}>Create Category</Button>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1"><Label>Bulk Edit %</Label><Input value={bulkPct} onChange={(e) => setBulkPct(e.target.value.replace(/[^\d.-]/g, ""))} placeholder="10 or -10" className="w-40" /></div>
            <Button variant="outline" onClick={() => void bulkAdjust()}>Apply Bulk Edit</Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead><tr className="border-b border-border"><th className="text-left py-2">Category</th><th className="text-left py-2">Price</th><th className="text-left py-2">Enabled</th><th className="text-right py-2">Actions</th></tr></thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id} className="border-b border-border/50">
                    <td className="py-2">{c.name}</td>
                    <td className="py-2">₦{Math.round(c.price).toLocaleString()}</td>
                    <td className="py-2">{c.enabled ? "Yes" : "No"}</td>
                    <td className="py-2 text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => void updateCategory(c.id, { price: Number(prompt(`New price for ${c.name}`, String(c.price)) || c.price) })}>Edit</Button>
                      <Button size="sm" variant="outline" onClick={() => void updateCategory(c.id, { enabled: !c.enabled })}>{c.enabled ? "Disable" : "Enable"}</Button>
                      <Button size="sm" variant="destructive" onClick={() => void deleteCategory(c.id)}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[740px] text-sm">
              <thead><tr className="border-b border-border"><th className="text-left py-2">Item</th><th className="text-left py-2">Category</th><th className="text-left py-2">Price</th><th className="text-left py-2">Status</th><th className="text-right py-2">Action</th></tr></thead>
              <tbody>
                {logs.slice(0, 80).map((l) => (
                  <tr key={l.id} className="border-b border-border/50">
                    <td className="py-2 font-mono text-xs">{l.username}</td>
                    <td className="py-2">{l.category}</td>
                    <td className="py-2">₦{Math.round(l.price).toLocaleString()}</td>
                    <td className="py-2">{l.status}</td>
                    <td className="py-2 text-right">
                      <Button size="sm" variant="outline" onClick={async () => {
                        const next = Number(prompt(`New price for ${l.username}`, String(l.price)) || l.price);
                        const res = await fetch("/api/admin/marketplace/update-price", {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action: "updateItemPrice", logId: l.id, price: next }),
                        });
                        const data = await res.json();
                        if (!res.ok) return toast.error(data.error ?? "Item update failed");
                        setLogs((prev) => prev.map((x) => (x.id === l.id ? { ...x, price: next } : x)));
                      }}>Edit Item Price</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
