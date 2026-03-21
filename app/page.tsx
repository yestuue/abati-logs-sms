import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/layout/logo";
import {
  ArrowRight,
  Shield,
  Zap,
  Globe,
  MessageSquare,
  Phone,
  Copy,
  CheckCircle,
} from "lucide-react";

export default function LandingPage() {
  const features = [
    {
      icon: Zap,
      title: "Instant Activation",
      description: "Get a virtual number in seconds, start receiving OTPs immediately.",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      icon: Globe,
      title: "Two Server System",
      description:
        "Server 1 for USA (+1) numbers. Server 2 for global coverage across 50+ countries.",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      icon: MessageSquare,
      title: "Real-Time SMS Inbox",
      description: "OTPs and messages routed directly to your private dashboard.",
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      icon: Shield,
      title: "Secure Wallet",
      description: "Fund your wallet via Paystack and use it across all purchases.",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
  ];

  const sampleNumbers = [
    { number: "+1 (202) 555-0147", country: "United States", server: "Server 1" },
    { number: "+44 7911 123456", country: "United Kingdom", server: "Server 2" },
    { number: "+1 (310) 555-0192", country: "United States", server: "Server 1" },
    { number: "+49 30 1234567", country: "Germany", server: "Server 2" },
    { number: "+1 (646) 555-0183", country: "United States", server: "Server 1" },
    { number: "+33 1 23 45 67 89", country: "France", server: "Server 2" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button variant="brand" size="sm" asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-20 pb-16 px-4 overflow-hidden">
        {/* Glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-brand-600/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative">
          <Badge variant="default" className="mb-6 animate-pulse-ring">
            <Zap className="w-3 h-3" />
            Two-Server Virtual Number Platform
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
            Virtual Numbers for
            <br />
            <span className="bg-gradient-to-r from-brand-400 to-brand-300 bg-clip-text text-transparent">
              Every OTP Need
            </span>
          </h1>

          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Get instant USA numbers from Server 1 or global numbers from Server 2.
            Receive OTPs in real-time with our smart SMS routing system.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="brand" size="xl" asChild>
              <Link href="/register">
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="outline" size="xl" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>

          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-muted-foreground">
            {["No credit card required", "Instant setup", "24/7 support"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Sample Numbers */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-sm text-muted-foreground mb-6 uppercase tracking-wider font-medium">
            Sample Available Numbers
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sampleNumbers.map((n, i) => (
              <div
                key={i}
                className="glass-card rounded-2xl p-4 flex items-center gap-3 hover:scale-[1.02] transition-transform"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono font-semibold text-foreground">
                    {n.number}
                  </p>
                  <p className="text-xs text-muted-foreground">{n.country}</p>
                </div>
                <Badge
                  variant={n.server === "Server 1" ? "info" : "success"}
                  className="text-[10px] flex-shrink-0"
                >
                  {n.server}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">
              Everything You Need
            </h2>
            <p className="text-muted-foreground mt-3">
              Built for speed, reliability, and simplicity
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="glass-card rounded-2xl p-6 hover:scale-[1.02] transition-transform"
                >
                  <div className={`w-10 h-10 rounded-2xl ${f.bg} flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {f.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="glass-card rounded-2xl p-10">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-muted-foreground mb-8">
              Create your free account and get a virtual number in under a minute.
            </p>
            <Button variant="brand" size="xl" asChild>
              <Link href="/register">
                Create Free Account
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            {["Terms", "Privacy", "Support"].map((l) => (
              <Link
                key={l}
                href={`/${l.toLowerCase()}`}
                className="hover:text-foreground transition-colors"
              >
                {l}
              </Link>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Abati Logs & SMS
          </p>
        </div>
      </footer>
    </div>
  );
}
