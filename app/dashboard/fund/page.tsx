"use client";

import { useEffect, useState } from "react";
import { Upload, Loader2, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

type FundingRequest = {
  id: string;
  amount: number;
  currency: "NGN" | "USD";
  status: "PENDING" | "APPROVED" | "REJECTED";
  proofUrl: string;
  note: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

export default function FundWalletPage() {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<FundingRequest[]>([]);

  async function loadRequests() {
    setLoading(true);
    try {
      const res = await fetch("/api/funding/manual");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load");
      setRequests(data.requests ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!proofFile) {
      toast.error("Upload payment proof screenshot");
      return;
    }

    const formData = new FormData();
    formData.append("amount", String(numericAmount));
    formData.append("currency", "NGN");
    formData.append("note", note);
    formData.append("proof", proofFile);

    setSubmitting(true);
    try {
      const res = await fetch("/api/funding/manual", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Submit failed");
      toast.success("Manual funding request submitted");
      setAmount("");
      setNote("");
      setProofFile(null);
      await loadRequests();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Manual Funding</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload payment proof and wait for admin approval to credit your wallet.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Submit New Request</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manual-amount">Amount (NGN)</Label>
                <Input
                  id="manual-amount"
                  type="number"
                  min="100"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proof-upload">Payment Proof Screenshot</Label>
                <Input
                  id="proof-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manual-note">Note (Optional)</Label>
              <Input
                id="manual-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Bank name, transfer reference, or any helpful detail"
              />
            </div>

            <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Submit Funding Request
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Request History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No funding requests yet.</p>
          ) : (
            requests.map((request) => (
              <div key={request.id} className="rounded-xl border border-border p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                  {request.status === "APPROVED" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : request.status === "REJECTED" ? (
                    <XCircle className="w-4 h-4 text-destructive" />
                  ) : (
                    <Clock3 className="w-4 h-4 text-amber-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">
                    {formatCurrency(request.amount, request.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Submitted {formatDate(request.createdAt)}
                  </p>
                </div>
                <a href={request.proofUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                  View proof
                </a>
                <Badge
                  variant={
                    request.status === "APPROVED"
                      ? "success"
                      : request.status === "REJECTED"
                      ? "destructive"
                      : "warning"
                  }
                >
                  {request.status}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
