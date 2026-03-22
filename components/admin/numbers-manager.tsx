"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Phone, Plus, Trash2, Search, Loader2,
  CheckCircle, Server,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Matches what prisma.virtualNumber.findMany returns (schema fields)
type NumberRow = {
  id: string;
  number: string;
  country: string;
  countryCode: string;
  server: string;
  status: string;
  priceNGN: number;
  priceUSD: number;
  user: { name: string | null; email: string } | null;
};

interface NumbersManagerProps {
  numbers: NumberRow[];
}

const STATUS_VARIANT = {
  AVAILABLE: "success",
  ASSIGNED:  "info",
  EXPIRED:   "warning",
  SUSPENDED: "destructive",
} as const;

const EMPTY_FORM = {
  number: "", country: "", countryCode: "", server: "SERVER1",
  priceNGN: "500", priceUSD: "0.5",
};

export function NumbersManager({ numbers: initial }: NumbersManagerProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [serverFilter, setServerFilter] = useState<"ALL" | "SERVER1" | "SERVER2">("ALL");
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<NumberRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [addLoading, setAddLoading] = useState(false);

  const filtered = initial.filter((n) => {
    const matchSearch =
      n.number.includes(search) ||
      n.country.toLowerCase().includes(search.toLowerCase()) ||
      (n.user?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (n.user?.email ?? "").toLowerCase().includes(search.toLowerCase());
    const matchServer = serverFilter === "ALL" || n.server === serverFilter;
    return matchSearch && matchServer;
  });

  const server1 = filtered.filter((n) => n.server === "SERVER1");
  const server2 = filtered.filter((n) => n.server === "SERVER2");

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.number.trim() || !form.country.trim() || !form.countryCode.trim()) {
      toast.error("Number, country name, and country code are required");
      return;
    }
    setAddLoading(true);
    try {
      const res = await fetch("/api/admin/numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number:      form.number.trim(),
          country:     form.country.trim(),
          countryCode: form.countryCode.trim().toUpperCase(),
          server:      form.server,
          priceNGN:    parseFloat(form.priceNGN) || 500,
          priceUSD:    parseFloat(form.priceUSD) || 0.5,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to add number");
        return;
      }
      toast.success(`${form.number} added to ${form.server === "SERVER1" ? "Server 1" : "Server 2"}`);
      setForm(EMPTY_FORM);
      setAddOpen(false);
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setAddLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/admin/numbers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to delete");
        return;
      }
      toast.success(`${deleteTarget.number} removed`);
      setDeleteTarget(null);
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setDeleteLoading(false);
    }
  }

  const NumberTable = ({ nums, title, emoji }: { nums: NumberRow[]; title: string; emoji: string }) => (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{emoji}</span>
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          <Badge variant="secondary">{nums.length} numbers</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/30">
          {nums.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 px-4 py-3 hover:bg-accent/20 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono font-semibold">{n.number}</p>
                <p className="text-xs text-muted-foreground">{n.country} ({n.countryCode})</p>
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-xs font-semibold text-foreground">₦{n.priceNGN.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">${n.priceUSD}</p>
              </div>
              {n.user ? (
                <div className="text-right hidden md:block max-w-[140px]">
                  <p className="text-xs font-medium truncate">{n.user.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{n.user.email}</p>
                </div>
              ) : (
                <div className="hidden md:block w-[140px]" />
              )}
              <Badge
                variant={STATUS_VARIANT[n.status as keyof typeof STATUS_VARIANT] ?? "secondary"}
                className="text-[10px] flex-shrink-0"
              >
                {n.status}
              </Badge>
              {n.status !== "ASSIGNED" && (
                <button
                  onClick={() => setDeleteTarget(n)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  title="Delete number"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </motion.div>
          ))}
          {nums.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Phone className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No numbers found</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search numbers, countries, users…"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          {(["ALL", "SERVER1", "SERVER2"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setServerFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                serverFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "ALL" ? "All" : s === "SERVER1" ? "🇺🇸 S1" : "🌍 S2"}
            </button>
          ))}
        </div>

        <Button variant="brand" size="sm" onClick={() => setAddOpen(true)} className="flex-shrink-0">
          <Plus className="w-4 h-4" />
          Add Number
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total",     value: initial.length,                                        color: "text-foreground" },
          { label: "Available", value: initial.filter((n) => n.status === "AVAILABLE").length, color: "text-emerald-500" },
          { label: "Assigned",  value: initial.filter((n) => n.status === "ASSIGNED").length,  color: "text-blue-500" },
          { label: "Expired",   value: initial.filter((n) => n.status === "EXPIRED").length,   color: "text-amber-500" },
        ].map((s) => (
          <div
            key={s.label}
            className="flex items-center justify-between p-3 rounded-xl"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
            <span className={`text-lg font-bold ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {(serverFilter === "ALL" || serverFilter === "SERVER1") && (
          <NumberTable nums={server1} title="Server 1 — USA Numbers" emoji="🇺🇸" />
        )}
        {(serverFilter === "ALL" || serverFilter === "SERVER2") && (
          <NumberTable nums={server2} title="Server 2 — Global Numbers" emoji="🌍" />
        )}
      </div>

      {/* Add Number Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Server className="w-4 h-4 text-primary" />
              Add Virtual Number
            </DialogTitle>
            <DialogDescription>Add a new number to the inventory pool</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="add-number">Phone Number</Label>
              <Input
                id="add-number"
                placeholder="+12345678900"
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="add-country">Country Name</Label>
                <Input
                  id="add-country"
                  placeholder="United States"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="add-code">Country Code</Label>
                <Input
                  id="add-code"
                  placeholder="US"
                  maxLength={3}
                  value={form.countryCode}
                  onChange={(e) => setForm({ ...form, countryCode: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Server</Label>
              <Select
                value={form.server}
                onValueChange={(v) => setForm({ ...form, server: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SERVER1">🇺🇸 Server 1 (USA)</SelectItem>
                  <SelectItem value="SERVER2">🌍 Server 2 (Global)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="add-ngn">Price (₦)</Label>
                <Input
                  id="add-ngn"
                  type="number"
                  min="0"
                  step="50"
                  placeholder="500"
                  value={form.priceNGN}
                  onChange={(e) => setForm({ ...form, priceNGN: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="add-usd">Price ($)</Label>
                <Input
                  id="add-usd"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="0.50"
                  value={form.priceUSD}
                  onChange={(e) => setForm({ ...form, priceUSD: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="brand" disabled={addLoading}>
                {addLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <><CheckCircle className="w-4 h-4" /> Add Number</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-4 h-4" />
              Delete Number
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-mono font-semibold text-foreground">
                {deleteTarget?.number}
              </span>{" "}
              from the pool? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
