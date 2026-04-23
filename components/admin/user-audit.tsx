"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Wallet,
  XCircle,
  Shield,
  Phone,
  CreditCard,
  MessageSquare,
  Loader2,
  Plus,
  Ban,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isBanned: boolean;
  walletBalance: number;
  walletCurrency: string;
  isVerified: boolean;
  createdAt: Date;
  _count: { numbers: number; transactions: number; smsMessages: number };
};

interface UserAuditProps {
  users: UserRow[];
}

export function UserAudit({ users }: UserAuditProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [topupAmount, setTopupAmount] = useState("");
  const [topupLoading, setTopupLoading] = useState(false);
  const [transactions, setTransactions] = useState<
    { id: string; amount: number; currency: string; type: string; status: string; createdAt: Date }[]
  >([]);
  const [txLoading, setTxLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState("");

  const filtered = users.filter(
    (u) =>
      (u.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  async function openUser(user: UserRow) {
    setSelected(user);
    setTopupAmount("");
    setTxLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/transactions`);
      const data = await res.json();
      setTransactions(data.transactions ?? []);
    } catch {
      toast.error("Failed to load transactions");
    } finally {
      setTxLoading(false);
    }
  }

  async function handleTopup() {
    const amt = parseFloat(topupAmount);
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setTopupLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${selected!.id}/topup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt, currency: selected!.walletCurrency }),
      });
      if (!res.ok) throw new Error();
      toast.success(`₦${amt.toLocaleString()} credited to ${selected!.name}`);
      setTopupAmount("");
      setSelected(null);
      router.refresh();
    } catch {
      toast.error("Failed to credit wallet");
    } finally {
      setTopupLoading(false);
    }
  }

  async function handleToggleBan() {
    if (!selected) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${selected.id}/ban`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update user");
      toast.success(data.isBanned ? "User banned successfully" : "User unbanned successfully");
      setSelected(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update ban status");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteUser() {
    if (!selected) return;
    if (!confirm(`Delete ${selected.email}? This cannot be undone.`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${selected.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to delete user");
      toast.success("User deleted");
      setSelected(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete user");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteAllUsers() {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/users/delete-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: deleteAllConfirm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Delete all failed");
      toast.success(`Deleted ${data.deletedUsers ?? 0} users`);
      setDeleteAllConfirm("");
      setDeleteAllOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete all failed");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search users…"
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Badge variant="secondary">{filtered.length} users</Badge>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setDeleteAllOpen(true)}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Delete All Users
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/30">
            {filtered.map((u, i) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-accent/20 transition-colors cursor-pointer"
                onClick={() => openUser(u)}
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">
                    {(u.name ?? u.email)[0].toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{u.name}</span>
                    {u.role === "ADMIN" && (
                      <Shield className="w-3 h-3 text-amber-400 flex-shrink-0" />
                    )}
                    {u.isBanned && <Badge variant="destructive" className="text-[10px]">BANNED</Badge>}
                    {!u.isVerified && (
                      <XCircle className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>

                {/* Wallet */}
                <div className="text-right hidden sm:block flex-shrink-0">
                  <p className="text-sm font-semibold text-foreground">
                    {formatCurrency(u.walletBalance, u.walletCurrency as "NGN" | "USD")}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {u._count.numbers}N · {u._count.transactions}T
                  </p>
                </div>

                {/* Role badge */}
                <Badge
                  variant={u.role === "ADMIN" ? "warning" : "secondary"}
                  className="text-[10px] flex-shrink-0 hidden sm:flex"
                >
                  {u.role}
                </Badge>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">
                  {(selected?.name ?? selected?.email ?? "?")[0].toUpperCase()}
                </span>
              </div>
              {selected?.name}
            </DialogTitle>
            <DialogDescription>{selected?.email}</DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={selected.isBanned ? "outline" : "secondary"}
                  onClick={handleToggleBan}
                  disabled={actionLoading}
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                  {selected.isBanned ? "Unban User" : "Ban User"}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteUser}
                  disabled={actionLoading}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete User
                </Button>
              </div>

              {/* User stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Phone, label: "Numbers", value: selected._count.numbers },
                  { icon: CreditCard, label: "Transactions", value: selected._count.transactions },
                  { icon: MessageSquare, label: "SMS", value: selected._count.smsMessages },
                ].map((s) => (
                  <div key={s.label} className="p-3 rounded-xl bg-muted/50 text-center">
                    <s.icon className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                    <p className="text-lg font-bold">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Wallet + top-up */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Wallet Balance</span>
                  </div>
                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(selected.walletBalance, selected.walletCurrency as "NGN" | "USD")}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Top-up amount (₦)"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Button
                    size="sm"
                    variant="brand"
                    onClick={handleTopup}
                    disabled={topupLoading || !topupAmount}
                    className="flex-shrink-0"
                  >
                    {topupLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        Credit
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Transaction history */}
              <div>
                <Label className="text-xs mb-2 block text-muted-foreground uppercase tracking-wider">
                  Recent Transactions
                </Label>
                <ScrollArea className="h-40">
                  {txLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : transactions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      No transactions found
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {transactions.map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/30"
                        >
                          <div>
                            <p className="text-xs font-medium">{tx.type.replace("_", " ")}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {formatDate(tx.createdAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">
                              {formatCurrency(tx.amount, tx.currency as "NGN" | "USD")}
                            </p>
                            <Badge
                              variant={
                                tx.status === "SUCCESS"
                                  ? "success"
                                  : tx.status === "FAILED"
                                  ? "destructive"
                                  : "warning"
                              }
                              className="text-[10px] px-1 py-0"
                            >
                              {tx.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete All Non-Admin Users</DialogTitle>
            <DialogDescription>
              This permanently removes all non-admin users. Type <strong>DELETE ALL</strong> to continue.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={deleteAllConfirm}
            onChange={(e) => setDeleteAllConfirm(e.target.value)}
            placeholder="Type DELETE ALL"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteAllOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAllUsers}
              disabled={actionLoading || deleteAllConfirm !== "DELETE ALL"}
            >
              {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Confirm Delete All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
