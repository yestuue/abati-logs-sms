"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy } from "lucide-react";

export function ReferralCopyActions({ link, code }: { link: string; code: string }) {
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Referral link copied");
    } catch {
      toast.error("Could not copy — copy manually");
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Referral code copied");
    } catch {
      toast.error("Could not copy — copy manually");
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" onClick={() => void copyLink()} className="gap-2">
        <Copy className="h-4 w-4" />
        Copy link
      </Button>
      <Button type="button" variant="outline" onClick={() => void copyCode()}>
        Copy code only
      </Button>
    </div>
  );
}
