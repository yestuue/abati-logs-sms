"use client";
import { useState } from "react";
import { AlertTriangle, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function VerifyBanner({ email }: { email: string }) {
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);

  if (dismissed) return null;

  async function resend() {
    setSending(true);
    try {
      const res = await fetch("/api/user/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        toast.success("Verification email sent! Check your inbox.");
      } else {
        toast.error("Could not send email. Try again later.");
      }
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium"
      style={{
        background: "#fef9c3",
        borderBottom: "1px solid #fde047",
        color: "#713f12",
      }}
    >
      <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: "#ca8a04" }} />
      <span className="flex-1">
        Please verify your email address to unlock all features.
      </span>
      <button
        onClick={resend}
        disabled={sending}
        className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-50 flex-shrink-0"
        style={{ background: "#fde047", color: "#713f12" }}
      >
        {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
        Resend Email
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="p-1 rounded-lg hover:opacity-60 transition-opacity flex-shrink-0"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
