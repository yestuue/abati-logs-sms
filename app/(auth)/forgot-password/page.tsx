"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/layout/logo";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Something went wrong");
        return;
      }
      setSent(true);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand-600/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm relative"
      >
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        <div className="glass-card rounded-2xl p-6 space-y-5">
          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4 py-4"
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
                style={{ background: "rgba(0,229,160,0.12)", border: "1px solid rgba(0,229,160,0.25)" }}
              >
                <CheckCircle className="w-7 h-7" style={{ color: "var(--primary)" }} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Check your email</h2>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  If <span className="font-medium text-foreground">{email}</span> is registered,
                  we&apos;ve sent a password reset link. Check your inbox (and spam folder).
                </p>
              </div>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-medium"
                style={{ color: "var(--primary)" }}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </motion.div>
          ) : (
            <>
              <div>
                <h1 className="text-xl font-bold text-foreground">Reset your password</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Enter your email and we&apos;ll send you a reset link
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-9"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="brand"
                  size="lg"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>

              <Link
                href="/login"
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
