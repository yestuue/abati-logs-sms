"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

function parsePositivePriceDraft(raw: string): number | null {
  const n = Number(String(raw).replace(/[^\d.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n);
}

type Service = {
  id: string;
  serviceKey: string;
  name: string;
  basePrice: number;
  basePriceServer2?: number | null;
  customPrice: number | null;
  premiumRate: number;
};

type ServerCfg = { server: "SERVER1" | "SERVER2"; isEnabled: boolean };
type CountryCfg = {
  id: string;
  slug: string;
  name: string;
  enabled: boolean;
  samplePrice?: number;
  server?: string;
};
type LogCategory = { id: string; name: string; price: number; stock: number; enabled: boolean };
type LogItem = { id: string; category: string; username: string; price: number; status: string };

export default function AdminPricingPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [servers, setServers] = useState<ServerCfg[]>([]);
  const [countries, setCountries] = useState<CountryCfg[]>([]);
  const [globalPremiumS1Pct, setGlobalPremiumS1Pct] = useState("35");
  const [globalPremiumS2Pct, setGlobalPremiumS2Pct] = useState("35");
  const [categories, setCategories] = useState<LogCategory[]>([]);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [newCategoryPrice, setNewCategoryPrice] = useState("");
  const [bulkPct, setBulkPct] = useState("");
  const [loading, setLoading] = useState(false);
  const [serviceDrafts, setServiceDrafts] = useState<Record<string, { s1: string; s2: string }>>({});
  const [countryDrafts, setCountryDrafts] = useState<Record<string, string>>({});
  const [serviceNameSearch, setServiceNameSearch] = useState("");
  const [serviceKeySearch, setServiceKeySearch] = useState("");
  const [servicesLoading, setServicesLoading] = useState(true);
  const [savingAll, setSavingAll] = useState(false);
  const [pendingCountryToggle, setPendingCountryToggle] = useState<string | null>(null);

  /** Loads every row from the Service model (admin pricing table). */
  const fetchAdminServices = useCallback(async () => {
    setServicesLoading(true);
    try {
      const res = await fetch("/api/admin/pricing", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load services");
      const list = (data.services ?? []) as Service[];
      setServices(list);
      setServiceDrafts(
        Object.fromEntries(
          list.map((s) => [
            s.id,
            {
              s1: String(Math.round(s.basePrice)),
              s2: String(
                Math.round(
                  typeof s.basePriceServer2 === "number" && Number.isFinite(s.basePriceServer2)
                    ? s.basePriceServer2
                    : s.basePrice
                )
              ),
            },
          ])
        )
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load services");
    } finally {
      setServicesLoading(false);
    }
  }, []);

  async function loadSms() {
    const res = await fetch("/api/admin/sms/update-price", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to load SMS pricing");
    const list = (data.countries ?? []) as CountryCfg[];
    setServers(data.servers ?? []);
    setCountries(list);
    setCountryDrafts(
      Object.fromEntries(
        list.map((c) => [
          c.slug,
          c.samplePrice != null && Number.isFinite(c.samplePrice) ? String(Math.round(c.samplePrice)) : "",
        ])
      )
    );
    const s1 = Number(data.globalPremiumRateServer1 ?? data.globalPremiumRate ?? 0.35) || 0.35;
    const s2 = Number(data.globalPremiumRateServer2 ?? 0.35) || 0.35;
    setGlobalPremiumS1Pct(String(Math.round(s1 * 100)));
    setGlobalPremiumS2Pct(String(Math.round(s2 * 100)));
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
      await Promise.all([loadSms(), loadMarketplace(), fetchAdminServices()]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load pricing data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchAdminServices();
  }, [fetchAdminServices]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        await Promise.all([loadSms(), loadMarketplace()]);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load pricing data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredServices = useMemo(() => {
    const nq = serviceNameSearch.trim().toLowerCase();
    const kq = serviceKeySearch.trim().toLowerCase();
    const base = services.filter((s) => {
      if (nq && !s.name.toLowerCase().includes(nq)) return false;
      if (kq && !s.serviceKey.toLowerCase().includes(kq)) return false;
      return true;
    });
    return [...base].sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
  }, [services, serviceNameSearch, serviceKeySearch]);

  const sortedCountries = useMemo(
    () =>
      [...countries].sort((a, b) =>
        a.name.localeCompare(b.name, "en", { sensitivity: "base" })
      ),
    [countries]
  );

  const sortedServers = useMemo(
    () => [...servers].sort((a, b) => a.server.localeCompare(b.server)),
    [servers]
  );

  const hasPendingPriceChanges = useMemo(() => {
    for (const s of services) {
      const d = serviceDrafts[s.id];
      const p1 = parsePositivePriceDraft(d?.s1 ?? "");
      const p2 = parsePositivePriceDraft(d?.s2 ?? "");
      const cur2 =
        typeof s.basePriceServer2 === "number" && Number.isFinite(s.basePriceServer2)
          ? Math.round(s.basePriceServer2)
          : Math.round(s.basePrice);
      if (p1 != null && p1 !== Math.round(s.basePrice)) return true;
      if (p2 != null && p2 !== cur2) return true;
    }
    for (const c of countries) {
      const p = parsePositivePriceDraft(countryDrafts[c.slug] ?? "");
      const cur =
        c.samplePrice != null && Number.isFinite(c.samplePrice) ? Math.round(c.samplePrice) : null;
      if (p != null && p !== cur) return true;
    }
    return false;
  }, [services, countries, serviceDrafts, countryDrafts]);

  async function saveGlobalPremiumServer(target: "SERVER1" | "SERVER2") {
    const raw = target === "SERVER1" ? globalPremiumS1Pct : globalPremiumS2Pct;
    const pct = Number(raw);
    if (!Number.isFinite(pct) || pct < 0 || pct > 500) {
      toast.error("Premium % must be between 0 and 500");
      return;
    }
    const res = await fetch("/api/admin/sms/update-price", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "globalPremium",
        premiumRate: pct / 100,
        premiumTarget: target,
      }),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error ?? "Premium update failed");
    toast.success(target === "SERVER1" ? "Server 1 premium saved" : "Server 2 premium saved");
    await Promise.all([loadSms(), fetchAdminServices()]);
  }

  async function updateServiceBasePrice(id: string) {
    const row = serviceDrafts[id];
    const basePrice = parsePositivePriceDraft(row?.s1 ?? "");
    const basePriceServer2 = parsePositivePriceDraft(row?.s2 ?? "");
    if (basePrice == null || basePriceServer2 == null) {
      toast.error("Enter valid S1 and S2 prices");
      return;
    }
    const res = await fetch("/api/admin/pricing/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceId: id, basePrice, basePriceServer2 }),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error ?? "Update failed");
    const updated = data.service as Service;
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
    setServiceDrafts((prev) => ({
      ...prev,
      [id]: {
        s1: String(Math.round(updated.basePrice)),
        s2: String(
          Math.round(
            typeof updated.basePriceServer2 === "number" && Number.isFinite(updated.basePriceServer2)
              ? updated.basePriceServer2
              : updated.basePrice
          )
        ),
      },
    }));
    toast.success("Service S1/S2 prices saved");
  }

  async function updateCountryBasePrice(slug: string) {
    const basePrice = parsePositivePriceDraft(countryDrafts[slug] ?? "");
    if (basePrice == null) {
      toast.error("Enter a valid sample price");
      return;
    }
    const res = await fetch("/api/admin/pricing/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ countrySlug: slug, basePrice }),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error ?? "Update failed");
    const updated = data.country as CountryCfg;
    setCountries((prev) => prev.map((c) => (c.slug === slug ? { ...c, ...updated } : c)));
    setCountryDrafts((prev) => ({
      ...prev,
      [slug]: String(Math.round(Number(updated.samplePrice) || basePrice)),
    }));
    toast.success("Country sample price saved");
  }

  async function saveAllPendingPrices() {
    const servicePayload = services
      .map((s) => {
        const row = serviceDrafts[s.id];
        const p1 = parsePositivePriceDraft(row?.s1 ?? "");
        const p2 = parsePositivePriceDraft(row?.s2 ?? "");
        const cur2 =
          typeof s.basePriceServer2 === "number" && Number.isFinite(s.basePriceServer2)
            ? Math.round(s.basePriceServer2)
            : Math.round(s.basePrice);
        const next: { serviceId: string; basePrice?: number; basePriceServer2?: number } = {
          serviceId: s.id,
        };
        if (p1 != null && p1 !== Math.round(s.basePrice)) next.basePrice = p1;
        if (p2 != null && p2 !== cur2) next.basePriceServer2 = p2;
        if (typeof next.basePrice !== "number" && typeof next.basePriceServer2 !== "number") return null;
        return next;
      })
      .filter(Boolean) as { serviceId: string; basePrice?: number; basePriceServer2?: number }[];

    const countryPayload = countries
      .map((c) => {
        const p = parsePositivePriceDraft(countryDrafts[c.slug] ?? "");
        const cur =
          c.samplePrice != null && Number.isFinite(c.samplePrice) ? Math.round(c.samplePrice) : null;
        if (p == null || p === cur) return null;
        return { countrySlug: c.slug, basePrice: p };
      })
      .filter(Boolean) as { countrySlug: string; basePrice: number }[];

    if (servicePayload.length === 0 && countryPayload.length === 0) {
      toast.message("No price changes to save");
      return;
    }

    setSavingAll(true);
    try {
      const res = await fetch("/api/admin/pricing/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ services: servicePayload, countries: countryPayload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Batch save failed");
      toast.success(
        `Saved ${data.updatedServices ?? 0} service(s) and ${data.updatedCountries ?? 0} countr${(data.updatedCountries ?? 0) === 1 ? "y" : "ies"}`
      );
      await Promise.all([fetchAdminServices(), loadSms()]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Batch save failed");
    } finally {
      setSavingAll(false);
    }
  }

  async function syncSmsCatalog() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/pricing?syncCatalog=1", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Catalog sync failed");
      const syncedList = (data.services ?? []) as Service[];
      if (syncedList.length > 0) {
        setServices(syncedList);
        setServiceDrafts(
          Object.fromEntries(
            syncedList.map((s) => [
              s.id,
              {
                s1: String(Math.round(s.basePrice)),
                s2: String(
                  Math.round(
                    typeof s.basePriceServer2 === "number" && Number.isFinite(s.basePriceServer2)
                      ? s.basePriceServer2
                      : s.basePrice
                  )
                ),
              },
            ])
          )
        );
      }
      toast.success(`Catalog synced (${data.syncedKeys ?? 0} keys)`);
      if (syncedList.length === 0) await fetchAdminServices();
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
    toast.success(`${server === "SERVER1" ? "Server 1" : "Server 2"} ${isEnabled ? "enabled" : "disabled"}`);
  }

  async function toggleCountry(slug: string, isEnabled: boolean) {
    setPendingCountryToggle(slug);
    try {
      const res = await fetch("/api/admin/sms/update-price", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "toggleCountry", countrySlug: slug, isEnabled }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error ?? "Country update failed");
      setCountries((prev) => prev.map((c) => (c.slug === slug ? { ...c, isEnabled } : c)));
    } finally {
      setPendingCountryToggle(null);
    }
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
    <>
    <div className="space-y-6 pb-28">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border/80 bg-muted/20 p-3">
              <div className="space-y-1 min-w-0 flex-1">
                <Label htmlFor="premium-s1">Server 1 Premium %</Label>
                <Input
                  id="premium-s1"
                  value={globalPremiumS1Pct}
                  onChange={(e) => setGlobalPremiumS1Pct(e.target.value.replace(/[^\d.]/g, ""))}
                  className="max-w-[200px]"
                  inputMode="decimal"
                />
                <p className="text-[11px] text-muted-foreground">USA numbers — carrier / area-code preference</p>
              </div>
              <Button type="button" className="shrink-0" onClick={() => void saveGlobalPremiumServer("SERVER1")}>
                Save S1 Premium
              </Button>
            </div>
            <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border/80 bg-muted/20 p-3">
              <div className="space-y-1 min-w-0 flex-1">
                <Label htmlFor="premium-s2">Server 2 Premium %</Label>
                <Input
                  id="premium-s2"
                  value={globalPremiumS2Pct}
                  onChange={(e) => setGlobalPremiumS2Pct(e.target.value.replace(/[^\d.]/g, ""))}
                  className="max-w-[200px]"
                  inputMode="decimal"
                />
                <p className="text-[11px] text-muted-foreground">Global country numbers</p>
              </div>
              <Button type="button" className="shrink-0" onClick={() => void saveGlobalPremiumServer("SERVER2")}>
                Save S2 Premium
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <Button variant="outline" onClick={() => void syncServer2Countries()}>Fetch Server 2 Countries</Button>
            <Button variant="secondary" onClick={() => void syncSmsCatalog()} disabled={loading}>
              Sync SMS catalog (5SIM)
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sortedServers.map((s) => (
              <div
                key={s.server}
                className="flex items-center justify-between gap-3 border border-border rounded-xl px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{s.server}</p>
                  <p className="text-xs text-muted-foreground">Toggle availability</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">{s.isEnabled ? "On" : "Off"}</span>
                  <Switch
                    checked={s.isEnabled}
                    onCheckedChange={(on) => void toggleServer(s.server, on)}
                    aria-label={`Toggle ${s.server}`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-semibold">Service pricing</h3>
            <p className="text-xs text-muted-foreground">
              Sorted A–Z. Each row has Server 1 and Server 2 prices. Filter by name and/or key using the
              fields below (side by side).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
            <div className="space-y-2">
              <Label htmlFor="svc-search-name" className="text-xs text-muted-foreground">
                Search by service name
              </Label>
              <Input
                id="svc-search-name"
                placeholder="e.g. WhatsApp, Telegram…"
                value={serviceNameSearch}
                onChange={(e) => setServiceNameSearch(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="svc-search-key" className="text-xs text-muted-foreground">
                Search by service key
              </Label>
              <Input
                id="svc-search-key"
                placeholder="e.g. whatsapp, telegram…"
                value={serviceKeySearch}
                onChange={(e) => setServiceKeySearch(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {servicesLoading ? (
              <p className="text-sm text-muted-foreground py-6">Loading services from database…</p>
            ) : (
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2">Service name</th>
                    <th className="text-left py-2">Key</th>
                    <th className="text-left py-2">Server 1 price (₦)</th>
                    <th className="text-left py-2">Server 2 price (₦)</th>
                    <th className="text-right py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServices.map((s) => (
                    <tr key={s.id} className="border-b border-border/50">
                      <td className="py-2 font-medium align-top">{s.name}</td>
                      <td className="py-2 align-top">
                        <span className="font-mono text-xs text-muted-foreground">{s.serviceKey}</span>
                      </td>
                      <td className="py-2 align-top">
                        <Input
                          value={serviceDrafts[s.id]?.s1 ?? ""}
                          onChange={(e) =>
                            setServiceDrafts((prev) => ({
                              ...prev,
                              [s.id]: {
                                s1: e.target.value.replace(/[^\d.]/g, ""),
                                s2: prev[s.id]?.s2 ?? "",
                              },
                            }))
                          }
                          className="h-8 w-36"
                          aria-label={`Server 1 price for ${s.name}`}
                        />
                        {s.customPrice != null && (
                          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                            Custom override ₦{Math.round(s.customPrice).toLocaleString()} (checkout)
                          </p>
                        )}
                      </td>
                      <td className="py-2 align-top">
                        <Input
                          value={serviceDrafts[s.id]?.s2 ?? ""}
                          onChange={(e) =>
                            setServiceDrafts((prev) => ({
                              ...prev,
                              [s.id]: {
                                s1: prev[s.id]?.s1 ?? "",
                                s2: e.target.value.replace(/[^\d.]/g, ""),
                              },
                            }))
                          }
                          className="h-8 w-36"
                          aria-label={`Server 2 price for ${s.name}`}
                        />
                      </td>
                      <td className="py-2 align-top text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 shrink-0"
                          onClick={() => void updateServiceBasePrice(s.id)}
                          aria-label={`Save server prices for ${s.name}`}
                        >
                          <Save className="h-4 w-4 mr-1.5" />
                          Save Both
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {!servicesLoading && filteredServices.length === 0 && (
              <p className="text-sm text-muted-foreground py-4">
                {services.length === 0
                  ? "No services in database yet. Click “Sync SMS catalog (5SIM)” to populate this table."
                  : "No services match your name/key filters."}
              </p>
            )}
          </div>

          <div className="space-y-1 pt-2 border-t border-border">
            <h3 className="text-sm font-semibold">Server 2 countries</h3>
            <p className="text-xs text-muted-foreground">
              Sorted A–Z by country name. Toggle enables or disables a country immediately. Sample price
              (₦) is saved per row or via Save All Changes.
            </p>
          </div>

          {sortedCountries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 px-1 rounded-md border border-dashed border-border">
              No countries yet. Use “Fetch Server 2 Countries” to sync from the provider.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-border">
              <div className="max-h-[min(28rem,55vh)] overflow-y-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="sticky top-0 z-[1] bg-card border-b border-border shadow-sm">
                    <tr>
                      <th className="text-left py-2 px-3">Country name</th>
                      <th className="text-left py-2 px-3">Key</th>
                      <th className="text-left py-2 px-3">Sample price (₦)</th>
                      <th className="text-right py-2 px-3">Enabled</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCountries.map((c) => (
                      <tr key={c.id} className="border-b border-border/50">
                        <td className="py-2 px-3 font-medium align-top">{c.name}</td>
                        <td className="py-2 px-3 align-top">
                          <span className="font-mono text-xs text-muted-foreground">{c.slug}</span>
                        </td>
                        <td className="py-2 px-3 align-top">
                          <div className="flex flex-wrap items-center gap-2">
                            <Input
                              value={countryDrafts[c.slug] ?? ""}
                              onChange={(e) =>
                                setCountryDrafts((prev) => ({
                                  ...prev,
                                  [c.slug]: e.target.value.replace(/[^\d.]/g, ""),
                                }))
                              }
                              className="h-8 w-36"
                              aria-label={`Sample price for ${c.name}`}
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              className="h-8 w-8 shrink-0"
                              onClick={() => void updateCountryBasePrice(c.slug)}
                              aria-label={`Save sample price for ${c.name}`}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                        <td className="py-2 px-3 align-top">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {c.enabled ? "On" : "Off"}
                            </span>
                            <Switch
                              checked={c.enabled}
                              disabled={pendingCountryToggle === c.slug}
                              onCheckedChange={(on) => void toggleCountry(c.slug, on)}
                              aria-label={`Toggle ${c.name}`}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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

    <div
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4 py-3 lg:left-[240px]"
      role="region"
      aria-label="Bulk save pricing"
    >
      <div className="mx-auto flex max-w-4xl flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-sm text-muted-foreground">
          {hasPendingPriceChanges
            ? "You have unsaved price edits (services and/or Server 2 countries)."
            : "No pending price changes."}
        </p>
        <Button
          className="sm:w-auto w-full shrink-0"
          disabled={!hasPendingPriceChanges || savingAll}
          onClick={() => void saveAllPendingPrices()}
        >
          {savingAll ? "Saving…" : "Save All Changes"}
        </Button>
      </div>
    </div>
    </>
  );
}
