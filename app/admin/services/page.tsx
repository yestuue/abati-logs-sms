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
  serviceKey: string;
  serviceName: string;
  basePrice: number;
  premiumRate: number;
};

export default function AdminServicesPage() {
  const [loading, setLoading] = useState(true);
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [services, setServices] = useState<SmsService[]>([]);
  const [globalPremiumPct, setGlobalPremiumPct] = useState("35");
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
      setGlobalPremiumPct(String(Math.round((Number(data.globalPremiumRate ?? 0.35) || 0.35) * 100)));
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

  async function saveGlobalPremium() {
    const pct = Number(globalPremiumPct);
    if (!Number.isFinite(pct) || pct < 0 || pct > 500) {
      toast.error("Global premium must be between 0 and 500%");
      return;
    }
    setSavingGlobal(true);
    try {
      const res = await fetch("/api/admin/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ premiumRate: pct / 100 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update global premium");
      setServices((prev) => prev.map((s) => ({ ...s, premiumRate: pct / 100 })));
      toast.success("Global premium updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update global premium");
    } finally {
      setSavingGlobal(false);
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
          serviceName: editing.serviceName,
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
          <CardTitle>Global Premium</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="w-full sm:max-w-[220px] space-y-2">
            <Label htmlFor="global-premium">Premium Percentage (%)</Label>
            <Input
              id="global-premium"
              value={globalPremiumPct}
              onChange={(e) => setGlobalPremiumPct(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="35"
            />
          </div>
          <Button onClick={() => void saveGlobalPremium()} disabled={savingGlobal}>
            {savingGlobal ? "Saving..." : "Apply to All Services"}
          </Button>
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
                    <td className="py-2.5">{s.serviceName}</td>
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
                {editing?.serviceName} ({editing?.serviceKey})
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
