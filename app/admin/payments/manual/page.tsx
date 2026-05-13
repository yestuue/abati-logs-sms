"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, X, Eye, Loader2, Mail } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

export default function AdminManualPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function fetchPayments() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/payments/manual");
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments);
      }
    } catch (err) {
      toast.error("Failed to fetch payments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPayments();
  }, []);

  async function handleAction(id: string, status: "APPROVED" | "REJECTED") {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/payments/manual/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        toast.success(`Payment ${status.toLowerCase()} successfully`);
        fetchPayments();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update payment");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Manual Bank Payments</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review and approve manual bank transfer screenshots.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2">User</th>
                  <th className="text-left py-3 px-2">Amount</th>
                  <th className="text-left py-3 px-2">Top-up Email</th>
                  <th className="text-left py-3 px-2">Status</th>
                  <th className="text-left py-3 px-2">Date</th>
                  <th className="text-right py-3 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      No manual payments found.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-3 px-2">
                        <div className="font-medium">{p.user?.username || "Unknown"}</div>
                        <div className="text-xs text-muted-foreground">{p.user?.email}</div>
                      </td>
                      <td className="py-3 px-2 font-bold text-primary">
                        ₦{p.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          <span>{p.email}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant={
                          p.status === "APPROVED" ? "success" : 
                          p.status === "REJECTED" ? "destructive" : "secondary"
                        }>
                          {p.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-xs text-muted-foreground">
                        {new Date(p.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedImage(p.screenshot)}
                        >
                          <Eye className="w-4 h-4 mr-1" /> View
                        </Button>
                        {p.status === "PENDING" && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleAction(p.id, "APPROVED")}
                              disabled={!!processingId}
                            >
                              {processingId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleAction(p.id, "REJECTED")}
                              disabled={!!processingId}
                            >
                              {processingId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-3xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>Payment Screenshot</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center bg-black/5 rounded-lg overflow-hidden">
            <img 
              src={selectedImage || ""} 
              alt="Payment proof" 
              className="max-w-full max-h-[70vh] object-contain" 
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
