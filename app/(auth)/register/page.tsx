"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/layout/logo";
import { toast } from "sonner";
import { signIn } from "next-auth/react";
import { isSuperAdminEmail, normalizeEmail } from "@/lib/admin-access";
import { getPublicSiteUrl } from "@/lib/site-url";

const PERKS = [
  "50+ countries supported",
  "Instant OTP delivery",
  "Social account marketplace",
  "Secure Paystack funding",
];

export default function RegisterPage() {
  const router = useRouter();
  const siteBase = getPublicSiteUrl();
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
    acceptedLegal: false,
  });
  const [show, setShow] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [referralRef, setReferralRef] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search).get("ref");
    if (q?.trim()) {
      const v = q.trim();
      setReferralRef(v);
      try {
        sessionStorage.setItem("register_ref", v);
      } catch {
        /* ignore */
      }
    } else {
      try {
        const stored = sessionStorage.getItem("register_ref");
        if (stored?.trim()) {
          const s = stored.trim();
          setReferralRef(s);
          // Keep referral visible in URL after navigation redirects.
          const u = new URL(window.location.href);
          u.searchParams.set("ref", s);
          window.history.replaceState({}, "", u.toString());
        }
      } catch {
        /* ignore */
      }
    }
  }, []);

  function update(field: keyof typeof form, val: string) {
    setForm((prev) => ({ ...prev, [field]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.username.trim()) {
      toast.error("Please choose a username");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (form.password !== form.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (!form.acceptedLegal) {
      toast.error("You must agree to the Terms & Conditions and Privacy Policy");
      return;
    }

    setLoading(true);

    let refPayload: string | undefined = referralRef ?? undefined;
    if (!refPayload) {
      try {
        const s = sessionStorage.getItem("register_ref")?.trim();
        if (s) refPayload = s;
      } catch {
        /* ignore */
      }
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: form.username,
        email: form.email,
        password: form.password,
        ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
        ...(refPayload ? { ref: refPayload } : {}),
        acceptedLegal: form.acceptedLegal,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error ?? "Registration failed");
      setLoading(false);
      return;
    }

    toast.success("Account created! Signing you in…");

    const normalizedEmail = normalizeEmail(form.email);
    await signIn("credentials", {
      email: normalizedEmail,
      password: form.password,
      redirect: false,
      callbackUrl: `${siteBase}/dashboard`,
    });

    router.push(isSuperAdminEmail(normalizedEmail) ? `${siteBase}/admin` : `${siteBase}/dashboard`);
  }

  const passwordStrength = form.password.length === 0 ? 0
    : form.password.length < 6 ? 1
    : form.password.length < 10 ? 2
    : 3;

  const strengthLabels = ["", "Weak", "Good", "Strong"];
  const strengthColors = ["", "oklch(0.53 0.22 27)", "oklch(0.80 0.15 80)", "oklch(0.62 0.18 150)"];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      {/* Background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full blur-3xl"
          style={{ background: "oklch(0.68 0.22 278 / 0.08)" }}
        />
        <div
          className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full blur-3xl"
          style={{ background: "oklch(0.55 0.24 278 / 0.06)" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-4xl relative grid lg:grid-cols-2 gap-8 items-start"
      >
        {/* Left: perks panel (desktop only) */}
        <div className="hidden lg:flex flex-col justify-center h-full py-8">
          <Logo size="lg" className="mb-6" />
          <h2
            className="text-3xl font-extrabold text-foreground leading-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Digital services,
            <br />
            <span style={{ color: "var(--primary)" }}>unlocked.</span>
          </h2>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
            Join thousands of digital professionals who use Abati Digital for virtual numbers,
            social accounts, and instant OTP delivery.
          </p>
          <div className="mt-6 space-y-3">
            {PERKS.map((perk) => (
              <div key={perk} className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "var(--primary)" }} />
                <span className="text-sm text-foreground">{perk}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: form */}
        <div>
          {/* Logo for mobile */}
          <div className="flex justify-center mb-6 lg:hidden">
            <Logo size="lg" />
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-5">
            <div>
              <h1
                className="text-xl font-bold text-foreground"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Create your account
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Free to join — no credit card required
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="johndoe123"
                  value={form.username}
                  onChange={(e) => update("username", e.target.value.replace(/\s/g, "").toLowerCase())}
                  required
                  autoComplete="username"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-email">Email Address</Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-phone">Phone (optional)</Label>
                <Input
                  id="reg-phone"
                  type="tel"
                  placeholder="+234… — for Welcome to Abati SMS (Termii)"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  autoComplete="tel"
                />
                <p className="text-[11px] text-muted-foreground">
                  If provided, we send one welcome SMS via Termii. No Supabase sign-up.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-password">Password</Label>
                <div className="relative">
                  <Input
                    id="reg-password"
                    type={show ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    required
                    autoComplete="new-password"
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
                {/* Strength bar */}
                {form.password.length > 0 && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex gap-1 flex-1">
                      {[1, 2, 3].map((lvl) => (
                        <div
                          key={lvl}
                          className="h-1 flex-1 rounded-full transition-all duration-300"
                          style={{
                            background: passwordStrength >= lvl
                              ? strengthColors[passwordStrength]
                              : "var(--border)",
                          }}
                        />
                      ))}
                    </div>
                    <span
                      className="text-[10px] font-medium flex-shrink-0"
                      style={{ color: strengthColors[passwordStrength] }}
                    >
                      {strengthLabels[passwordStrength]}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirm"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Re-enter password"
                    value={form.confirm}
                    onChange={(e) => update("confirm", e.target.value)}
                    required
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.confirm && form.password !== form.confirm && (
                  <p className="text-[11px]" style={{ color: "oklch(0.53 0.22 27)" }}>
                    Passwords do not match
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-border p-3">
                <label className="flex items-start gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.acceptedLegal}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, acceptedLegal: e.target.checked }))
                    }
                    className="mt-0.5 h-4 w-4 rounded border-border"
                    required
                  />
                  <span className="text-muted-foreground">
                    I agree to the{" "}
                    <Link
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Terms &amp; Conditions
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>
              </div>

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
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</>
                ) : (
                  "Create Free Account"
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-medium hover:underline" style={{ color: "var(--primary)" }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
