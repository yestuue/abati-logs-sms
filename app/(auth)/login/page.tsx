"use client";
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/layout/logo";
import { toast } from "sonner";
import { isSuperAdminEmail, normalizeEmail } from "@/lib/admin-access";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { toast.error("Please enter your email"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }

    setLoading(true);
    const normalizedEmail = normalizeEmail(email);
    const res = await signIn("credentials", {
      email: normalizedEmail,
      password,
      redirect: false,
    });

    if (res?.error) {
      toast.error("Invalid email or password", {
        description: "Please check your credentials and try again.",
      });
      setLoading(false);
      return;
    }

    toast.success("Welcome back!");
    const destination = isSuperAdminEmail(normalizedEmail) ? "/admin" : callbackUrl;
    router.push(destination);
  }

  return (
    <div className="glass-card rounded-2xl p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
          Sign in to Abati Logs
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Access virtual numbers, social logs, and your wallet
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs hover:underline" style={{ color: "var(--primary)" }}>
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={show ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Remember me */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div
            onClick={() => setRemember(!remember)}
            className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all"
            style={
              remember
                ? {
                    background: "linear-gradient(135deg, oklch(0.68 0.22 278), oklch(0.55 0.24 278))",
                    borderColor: "oklch(0.68 0.22 278)",
                  }
                : { background: "transparent", borderColor: "var(--border)" }
            }
          >
            {remember && <span className="text-white text-[10px] font-bold">✓</span>}
          </div>
          <span className="text-sm text-muted-foreground">Remember me</span>
        </label>

        <Button
          type="submit"
          size="lg"
          className="w-full font-semibold"
          style={{
            background: "linear-gradient(135deg, oklch(0.68 0.22 278), oklch(0.55 0.24 278))",
            color: "#fff",
            boxShadow: "0 4px 14px oklch(0.68 0.22 278 / 0.40)",
          }}
          disabled={loading}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
        </Button>
      </form>

      {/* Security note */}
      <div
        className="flex items-center gap-2 p-2.5 rounded-xl"
        style={{ background: "oklch(0.68 0.22 278 / 0.07)", border: "1px solid oklch(0.68 0.22 278 / 0.18)" }}
      >
        <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--primary)" }} />
        <p className="text-[11px] text-muted-foreground">
          Your session is encrypted and secured by NextAuth.
        </p>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium hover:underline" style={{ color: "var(--primary)" }}>
          Create one free
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      {/* Background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-3xl"
          style={{ background: "oklch(0.68 0.22 278 / 0.10)" }}
        />
        <div
          className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] rounded-full blur-3xl"
          style={{ background: "oklch(0.55 0.24 278 / 0.07)" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm relative"
      >
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        <Suspense
          fallback={
            <div className="glass-card rounded-2xl p-12 flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--primary)" }} />
              <p className="text-sm text-muted-foreground">Loading…</p>
            </div>
          }
        >
          <LoginForm />
        </Suspense>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By signing in you agree to our{" "}
          <Link href="/terms" className="hover:underline">Terms</Link>{" "}and{" "}
          <Link href="/privacy" className="hover:underline">Privacy Policy</Link>.
        </p>
      </motion.div>
    </div>
  );
}
