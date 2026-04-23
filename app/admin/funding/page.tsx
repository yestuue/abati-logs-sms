"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2, Clock3 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

type RequestRow = {
  id: string;
  amount: number;
  currency: "NGN" | "USD";
  proofUrl: string;
  note: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  user: { id: string; name: string | null; email: string };
};

export default function AdminFundingPage() {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/funding?status=PENDING");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load");
      setRequests(data.requests ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load funding requests");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(id: string) {
    setActionId(id);
    try {
      const res = await fetch(`/api/admin/funding/${id}/approve`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Approve failed");
      toast.success("Funding approved and wallet credited");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Approve failed");
    } finally {
      setActionId("");
    }
  }

  async function reject(id: string) {
    setActionId(id);
    try {
      const res = await fetch(`/api/admin/funding/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Reject failed");
      toast.success("Funding request removed");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Reject failed");
    } finally {
      setActionId("");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Manual Funding Queue</h1>
        <p className="text-sm text-indigo-200/70 mt-1">
          Review payment proofs, approve to credit wallets, or reject invalid submissions.
        </p>
      </div>

      <Card className="border-indigo-500/20 bg-slate-950/70">
        <CardHeader className="border-b border-indigo-500/20">
          <CardTitle className="text-indigo-100">Pending Requests ({requests.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {loading ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-300" />
            </div>
          ) : requests.length === 0 ? (
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-6 text-center text-indigo-200/70">
              <Clock3 className="w-5 h-5 mx-auto mb-2" />
              No pending manual funding requests.
            </div>
          ) : (
            requests.map((row) => (
              <div key={row.id} className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="flex-1 min-w-[220px]">
                    <p className="text-sm font-semibold text-indigo-50">
                      {row.user.name || "Unnamed User"} - {row.user.email}
                    </p>
                    <p className="text-xs text-indigo-200/70">
                      {formatDate(row.createdAt)} - {formatCurrency(row.amount, row.currency)}
                    </p>
                    {row.note ? <p className="text-xs text-indigo-200/80 mt-1">Note: {row.note}</p> : null}
                  </div>
                  <Badge variant="warning">{row.status}</Badge>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <a
                    href={row.proofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Open proof image
                  </a>
                  <Button
                    size="sm"
                    variant="brand"
                    onClick={() => approve(row.id)}
                    disabled={actionId === row.id}
                  >
                    {actionId === row.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => reject(row.id)}
                    disabled={actionId === row.id}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject/Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
