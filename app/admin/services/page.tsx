"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type SmsService = {
  id: string;
  key?: string;
  serviceKey: string;
  name: string;
  basePrice: number;
  premiumRate: number;
};

export default function AdminServicesPage() {
  const [loading, setLoading] = useState(true);
  const [savingGlobalS1, setSavingGlobalS1] = useState(false);
  const [savingGlobalS2, setSavingGlobalS2] = useState(false);
  const [services, setServices] = useState<SmsService[]>([]);
  const [globalPremiumS1Pct, setGlobalPremiumS1Pct] = useState("35");
  const [globalPremiumS2Pct, setGlobalPremiumS2Pct] = useState("35");
  const [editing, setEditing] = useState<SmsService | null>(null);
  const [formBasePrice, setFormBasePrice] = useState("");
  const [formPremiumPct, setFormPremiumPct] = useState("");
  const [savingRow, setSavingRow] = useState(false);

  async function loadServices() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/services", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load services");
      setServices(data.services ?? []);
      const s1 = Number(data.globalPremiumRateServer1 ?? data.globalPremiumRate ?? 0.35) || 0.35;
      const s2 = Number(data.globalPremiumRateServer2 ?? 0.35) || 0.35;
      setGlobalPremiumS1Pct(String(Math.round(s1 * 100)));
      setGlobalPremiumS2Pct(String(Math.round(s2 * 100)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load services");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadServices();
  }, []);

  const sorted = useMemo(
    () => [...services].sort((a, b) => a.serviceKey.localeCompare(b.serviceKey, "en")),
    [services]
  );

  async function saveGlobalPremiumServer(target: "SERVER1" | "SERVER2") {
    const raw = target === "SERVER1" ? globalPremiumS1Pct : globalPremiumS2Pct;
    const pct = Number(raw);
    if (!Number.isFinite(pct) || pct < 0 || pct > 500) {
      toast.error("Premium must be between 0 and 500%");
      return;
    }
    const setSaving = target === "SERVER1" ? setSavingGlobalS1 : setSavingGlobalS2;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ premiumRate: pct / 100, premiumTarget: target }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update premium");
      toast.success(target === "SERVER1" ? "Server 1 premium saved" : "Server 2 premium saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update premium");
    } finally {
      setSaving(false);
    }
  }

  function openEdit(service: SmsService) {
    setEditing(service);
    setFormBasePrice(String(Math.round(service.basePrice)));
    setFormPremiumPct(String(Math.round(service.premiumRate * 100)));
  }

  async function saveService() {
    if (!editing) return;
    const base = Number(formBasePrice);
    const premiumPct = Number(formPremiumPct);
    if (!Number.isFinite(base) || base <= 0) {
      toast.error("Base price must be greater than zero");
      return;
    }
    if (!Number.isFinite(premiumPct) || premiumPct < 0 || premiumPct > 500) {
      toast.error("Premium % must be between 0 and 500");
      return;
    }
    setSavingRow(true);
    try {
      const res = await fetch(`/api/admin/services/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          basePrice: base,
          premiumRate: premiumPct / 100,
          serviceName: editing.name,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update service");
      const updated = data.service as SmsService;
      setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setEditing(null);
      toast.success("Service pricing updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update service");
    } finally {
      setSavingRow(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Services Pricing</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage base SMS prices and premium percentages.
          </p>
        </div>
        <Button variant="outline" onClick={() => void loadServices()} disabled={loading}>
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Global premiums</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2 rounded-lg border border-border/80 bg-muted/20 p-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2 min-w-0 flex-1">
              <Label htmlFor="global-premium-s1">Server 1 Premium %</Label>
              <Input
                id="global-premium-s1"
                value={globalPremiumS1Pct}
                onChange={(e) => setGlobalPremiumS1Pct(e.target.value.replace(/[^\d.]/g, ""))}
                placeholder="35"
              />
            </div>
            <Button
              type="button"
              className="shrink-0"
              onClick={() => void saveGlobalPremiumServer("SERVER1")}
              disabled={savingGlobalS1}
            >
              {savingGlobalS1 ? "Saving…" : "Save S1 Premium"}
            </Button>
          </div>
          <div className="flex flex-col gap-2 rounded-lg border border-border/80 bg-muted/20 p-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2 min-w-0 flex-1">
              <Label htmlFor="global-premium-s2">Server 2 Premium %</Label>
              <Input
                id="global-premium-s2"
                value={globalPremiumS2Pct}
                onChange={(e) => setGlobalPremiumS2Pct(e.target.value.replace(/[^\d.]/g, ""))}
                placeholder="35"
              />
            </div>
            <Button
              type="button"
              className="shrink-0"
              onClick={() => void saveGlobalPremiumServer("SERVER2")}
              disabled={savingGlobalS2}
            >
              {savingGlobalS2 ? "Saving…" : "Save S2 Premium"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SMS Services</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2">Service</th>
                <th className="text-left py-2">Key</th>
                <th className="text-left py-2">Base Price (NGN)</th>
                <th className="text-left py-2">Premium (%)</th>
                <th className="text-right py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="py-6 text-muted-foreground" colSpan={5}>
                    Loading services...
                  </td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td className="py-6 text-muted-foreground" colSpan={5}>
                    No services found.
                  </td>
                </tr>
              ) : (
                sorted.map((s) => (
                  <tr key={s.id} className="border-b border-border/50">
                    <td className="py-2.5">{s.name}</td>
                    <td className="py-2.5 font-mono text-xs text-muted-foreground">{s.serviceKey}</td>
                    <td className="py-2.5">₦{Math.round(s.basePrice).toLocaleString()}</td>
                    <td className="py-2.5">{Math.round(s.premiumRate * 100)}%</td>
                    <td className="py-2.5 text-right">
                      <Button size="sm" variant="outline" onClick={() => openEdit(s)}>
                        Edit Price
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Service Price</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Service</Label>
              <p className="text-sm text-muted-foreground">
                {editing?.name} ({editing?.serviceKey})
              </p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="base-price">Base Price (NGN)</Label>
              <Input
                id="base-price"
                value={formBasePrice}
                onChange={(e) => setFormBasePrice(e.target.value.replace(/[^\d.]/g, ""))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="premium-pct">Premium Percentage (%)</Label>
              <Input
                id="premium-pct"
                value={formPremiumPct}
                onChange={(e) => setFormPremiumPct(e.target.value.replace(/[^\d.]/g, ""))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={() => void saveService()} disabled={savingRow}>
              {savingRow ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
