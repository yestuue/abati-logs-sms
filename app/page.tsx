"use client";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { NumbersShowcase } from "@/components/landing/numbers-showcase";
import { FloatingSupport } from "@/components/landing/floating-support";
import {
  ArrowRight, CheckCircle, Zap, Globe, MessageSquare, Shield,
  Star, Users, Phone, Clock, BadgeCheck, TrendingUp,
  Twitter, Send, Mail, HeartHandshake,
} from "lucide-react";

// ── Animation primitives ──────────────────────────────────────────────────────
const fadeUp = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0,  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};
const fadeIn = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};
const staggerContainer = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.1 } },
};
const scaleIn = {
  hidden:  { opacity: 0, scale: 0.88 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

// ── Scroll-triggered section wrapper ─────────────────────────────────────────
function InView({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      variants={staggerContainer}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Count-up number animation ─────────────────────────────────────────────────
function CountUpNumber({ end, suffix = "", duration = 1800 }: { end: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(step);
      else setCount(end);
    };
    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, end, duration]);

  const formatted = end >= 1000 ? count.toLocaleString("en-US") : count.toString();
  return <span ref={ref}>{formatted}{suffix}</span>;
}

// ── Features data ──────────────────────────────────────────────────────────────
const features = [
  { icon: Zap,          title: "Instant Activation",  description: "Get a virtual number in seconds, start receiving OTPs immediately." },
  { icon: Globe,        title: "Two Server System",   description: "Server 1 for USA (+1) numbers. Server 2 for global coverage across 50+ countries." },
  { icon: MessageSquare,title: "Real-Time SMS Inbox", description: "OTPs and messages routed directly to your private dashboard." },
  { icon: Shield,       title: "Secure Wallet",       description: "Fund your wallet via Paystack and use it across all purchases." },
];

// ── Trust stats ───────────────────────────────────────────────────────────────
const trustStats = [
  { icon: Users,      value: "2,500+",  label: "Active Users",    countTo: 2500,  suffix: "+" },
  { icon: Phone,      value: "10,000+", label: "Numbers Issued",  countTo: 10000, suffix: "+" },
  { icon: BadgeCheck, value: "99.9%",   label: "Uptime",          countTo: null,  suffix: ""  },
  { icon: Clock,      value: "< 5s",    label: "OTP Delivery",    countTo: null,  suffix: ""  },
];

// ── Testimonials ──────────────────────────────────────────────────────────────
const testimonials = [
  {
    name: "Adebayo Okonkwo",
    handle: "@adebayo_ok",
    avatar: "AO",
    stars: 5,
    text: "Abati Logs is hands down the best virtual number service I've used. Got my OTP in under 3 seconds. No stress, no lag. 100% recommend!",
    tag: "Verified User",
  },
  {
    name: "Chiamaka Ezeh",
    handle: "@chiamaka_e",
    avatar: "CE",
    stars: 5,
    text: "I needed a USA number for verification and Server 1 delivered instantly. The wallet top-up via Paystack was super smooth too.",
    tag: "Server 1 User",
  },
  {
    name: "Tunde Fashola",
    handle: "@tunde_f",
    avatar: "TF",
    stars: 5,
    text: "Been using this for 3 months now. The dashboard is clean, SMS arrives fast, and the support team responds on WhatsApp within minutes.",
    tag: "Power User",
  },
  {
    name: "Kelechi Nwosu",
    handle: "@kel_nw",
    avatar: "KN",
    stars: 5,
    text: "Global numbers from Server 2 are perfect for my international accounts. The platform just works — no downtime, no excuses.",
    tag: "Server 2 User",
  },
  {
    name: "Fatimah Aliyu",
    handle: "@fatimah_a",
    avatar: "FA",
    stars: 5,
    text: "The real-time SMS inbox is a game changer. I can see OTPs the moment they arrive. Clean UI, great service. Keep it up!",
    tag: "Verified User",
  },
  {
    name: "Emeka Obi",
    handle: "@emeka_obi",
    avatar: "EO",
    stars: 5,
    text: "Cheapest and most reliable virtual number service in Nigeria. I've tried others but Abati Logs is superior in every way.",
    tag: "Long-term User",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--background)" }}>

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-50 border-b"
        style={{
          borderColor: "rgba(255,255,255,0.07)",
          background: "rgba(var(--background-rgb, 9,9,13),0.85)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-1.5 sm:gap-3">
            <ThemeToggle className="hidden sm:flex" />
            <Link
              href="/login"
              className="px-3 sm:px-4 py-2 text-sm font-medium transition-colors rounded-lg"
              style={{ color: "var(--muted-foreground)" }}
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 sm:px-5 py-2 rounded-[9px] text-sm font-bold transition-all hover:opacity-88 active:scale-95"
              style={{ background: "var(--primary)", color: "#09090d" }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative px-4 pt-16 pb-16 sm:pt-24 sm:pb-20 overflow-hidden">
        {/* Animated background glow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute inset-0 pointer-events-none"
        >
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2"
            style={{
              width: "min(700px, 100vw)",
              height: 500,
              background: "radial-gradient(ellipse, rgba(0,229,160,0.10) 0%, transparent 70%)",
            }}
          />
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="relative max-w-4xl mx-auto text-center"
        >
          {/* Badge */}
          <motion.div variants={fadeIn} className="mb-6 inline-block">
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: "rgba(0,229,160,0.08)",
                border: "1px solid rgba(0,229,160,0.22)",
                color: "var(--primary)",
              }}
            >
              <Zap className="w-3 h-3" />
              Two-Server Virtual Number Platform
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            className="text-[2.4rem] sm:text-5xl lg:text-[4rem] leading-[1.12] mb-5 px-2"
            style={{ fontFamily: "var(--font-heading)", fontWeight: 800 }}
          >
            Virtual Numbers for
            <br />
            <motion.span
              variants={fadeUp}
              style={{ color: "var(--primary)" }}
            >
              Every OTP Need
            </motion.span>
          </motion.h1>

          {/* Subline */}
          <motion.p
            variants={fadeUp}
            className="text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-8 px-2"
            style={{ color: "var(--muted-foreground)" }}
          >
            Get instant USA numbers from Server 1 or global numbers from Server 2.
            Receive OTPs in real-time — right in your dashboard.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            variants={fadeUp}
            className="flex flex-col xs:flex-row gap-3 justify-center mb-8 px-4"
          >
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-[10px] text-[15px] font-bold transition-all hover:opacity-90 hover:-translate-y-0.5 active:scale-95"
              style={{ background: "var(--primary)", color: "#09090d" }}
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-[10px] text-[15px] font-medium transition-all hover:-translate-y-0.5 active:scale-95"
              style={{ border: "1px solid rgba(255,255,255,0.12)", color: "var(--muted-foreground)" }}
            >
              Sign In
            </Link>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            variants={fadeIn}
            className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm"
            style={{ color: "var(--muted-foreground)" }}
          >
            {["No credit card required", "Instant setup", "24/7 support"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--primary)" }} />
                {t}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── Trust Stats Row ──────────────────────────────────────────────────── */}
      <section className="py-10 px-4 border-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-5xl mx-auto">
          <InView>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
              {trustStats.map((s) => {
                const Icon = s.icon;
                return (
                  <motion.div
                    key={s.label}
                    variants={scaleIn}
                    className="flex flex-col items-center text-center gap-2"
                  >
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center"
                      style={{ background: "rgba(0,229,160,0.08)", border: "1px solid rgba(0,229,160,0.18)" }}
                    >
                      <Icon className="w-5 h-5" style={{ color: "var(--primary)" }} />
                    </div>
                    <p className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
                      {s.countTo !== null
                        ? <CountUpNumber end={s.countTo} suffix={s.suffix} />
                        : s.value}
                    </p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </motion.div>
                );
              })}
            </div>
          </InView>
        </div>
      </section>

      {/* ── Numbers Showcase ─────────────────────────────────────────────────── */}
      <section className="py-10 sm:py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <InView>
            <motion.p
              variants={fadeIn}
              className="text-center text-[10px] sm:text-xs font-semibold uppercase tracking-widest mb-6"
              style={{ color: "var(--muted-foreground)" }}
            >
              Sample Available Numbers
            </motion.p>
            <motion.div variants={fadeUp}>
              <NumbersShowcase />
            </motion.div>
          </InView>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <InView>
            <div className="text-center mb-12 sm:mb-16">
              <motion.h2
                variants={fadeUp}
                className="text-3xl sm:text-[2.6rem] mb-3 sm:mb-4"
                style={{ fontFamily: "var(--font-heading)", fontWeight: 800 }}
              >
                Everything You Need
              </motion.h2>
              <motion.p
                variants={fadeUp}
                className="text-sm sm:text-base"
                style={{ color: "var(--muted-foreground)" }}
              >
                Built for speed, reliability, and simplicity
              </motion.p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {features.map((f) => {
                const Icon = f.icon;
                return (
                  <motion.div
                    key={f.title}
                    variants={scaleIn}
                    className="rounded-[16px] p-5 sm:p-6 transition-transform hover:scale-[1.02] cursor-default"
                    style={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                      style={{ background: "rgba(0,229,160,0.08)", border: "1px solid rgba(0,229,160,0.18)" }}
                    >
                      <Icon className="w-5 h-5" style={{ color: "var(--primary)" }} />
                    </div>
                    <h3
                      className="text-base mb-2"
                      style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}
                    >
                      {f.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                      {f.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </InView>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <InView className="text-center">
            <motion.h2
              variants={fadeUp}
              className="text-3xl sm:text-[2.6rem] mb-12"
              style={{ fontFamily: "var(--font-heading)", fontWeight: 800 }}
            >
              Up and running in 3 steps
            </motion.h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-center">
              {[
                { step: "01", title: "Create Account",   desc: "Sign up free in under 60 seconds." },
                { step: "02", title: "Fund Your Wallet", desc: "Top up via Paystack — cards, bank transfer, USSD." },
                { step: "03", title: "Get Your Number",  desc: "Pick a USA or global number and start receiving OTPs." },
              ].map((s) => (
                <motion.div key={s.step} variants={fadeUp} className="flex flex-col items-center">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-sm font-bold"
                    style={{ background: "rgba(0,229,160,0.10)", border: "1px solid rgba(0,229,160,0.22)", color: "var(--primary)", fontFamily: "var(--font-heading)" }}
                  >
                    {s.step}
                  </div>
                  <h3 className="font-semibold mb-1.5" style={{ fontFamily: "var(--font-heading)" }}>{s.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </InView>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <InView>
            <div className="text-center mb-12">
              <motion.div variants={fadeIn} className="mb-3 flex items-center justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" style={{ color: "#f59e0b" }} />
                ))}
              </motion.div>
              <motion.h2
                variants={fadeUp}
                className="text-3xl sm:text-[2.6rem] mb-3"
                style={{ fontFamily: "var(--font-heading)", fontWeight: 800 }}
              >
                Loved by Thousands
              </motion.h2>
              <motion.p
                variants={fadeUp}
                className="text-sm sm:text-base"
                style={{ color: "var(--muted-foreground)" }}
              >
                Real reviews from real users across Nigeria and beyond
              </motion.p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {testimonials.map((t, i) => (
                <motion.div
                  key={t.name}
                  variants={scaleIn}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-[16px] p-5 flex flex-col gap-4"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                  {/* Stars */}
                  <div className="flex gap-0.5">
                    {[...Array(t.stars)].map((_, j) => (
                      <Star key={j} className="w-3.5 h-3.5 fill-current" style={{ color: "#f59e0b" }} />
                    ))}
                  </div>

                  {/* Text */}
                  <p className="text-sm leading-relaxed flex-1" style={{ color: "var(--foreground)" }}>
                    &ldquo;{t.text}&rdquo;
                  </p>

                  {/* User */}
                  <div className="flex items-center gap-3 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: "rgba(0,229,160,0.12)", color: "var(--primary)" }}
                    >
                      {t.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{t.name}</p>
                      <p className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>
                        {t.handle}
                      </p>
                    </div>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: "rgba(0,229,160,0.10)", color: "var(--primary)", border: "1px solid rgba(0,229,160,0.20)" }}
                    >
                      {t.tag}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </InView>
        </div>
      </section>

      {/* ── Why Choose Us ────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <InView>
            <motion.div
              variants={scaleIn}
              className="rounded-[20px] p-8 sm:p-12"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <div>
                  <motion.h2
                    variants={fadeUp}
                    className="text-3xl sm:text-4xl mb-4"
                    style={{ fontFamily: "var(--font-heading)", fontWeight: 800 }}
                  >
                    Why Abati Logs?
                  </motion.h2>
                  <motion.p
                    variants={fadeUp}
                    className="text-sm sm:text-base mb-6 leading-relaxed"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    We built this platform specifically for the Nigerian market with global reach.
                    Fast delivery, honest pricing, and real support — no bots, no delays.
                  </motion.p>
                  <motion.div variants={staggerContainer} className="space-y-3">
                    {[
                      "Paystack-powered wallet — instant funding",
                      "Two dedicated servers for redundancy",
                      "WhatsApp support available 24/7",
                      "Numbers delivered in under 5 seconds",
                      "NGN & USD pricing supported",
                    ].map((item) => (
                      <motion.div
                        key={item}
                        variants={fadeUp}
                        className="flex items-center gap-3 text-sm"
                      >
                        <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: "var(--primary)" }} />
                        <span>{item}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: TrendingUp, value: "₦500", label: "Starting from", sub: "Per number" },
                    { icon: Globe,      value: "50+",   label: "Countries",    sub: "Global coverage" },
                    { icon: Clock,      value: "< 5s",  label: "OTP Speed",    sub: "Real-time delivery" },
                    { icon: HeartHandshake, value: "24/7", label: "Support",   sub: "WhatsApp & chat" },
                  ].map((s) => {
                    const Icon = s.icon;
                    return (
                      <motion.div
                        key={s.label}
                        variants={scaleIn}
                        className="rounded-2xl p-4 text-center"
                        style={{ background: "rgba(0,229,160,0.04)", border: "1px solid rgba(0,229,160,0.12)" }}
                      >
                        <Icon className="w-6 h-6 mx-auto mb-2" style={{ color: "var(--primary)" }} />
                        <p className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>{s.value}</p>
                        <p className="text-xs font-semibold mt-0.5">{s.label}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>{s.sub}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </InView>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <InView>
            <motion.div
              variants={scaleIn}
              className="rounded-[20px] p-10 sm:p-14 text-center"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <h2
                className="text-3xl sm:text-4xl mb-4"
                style={{ fontFamily: "var(--font-heading)", fontWeight: 800 }}
              >
                Ready to Get Started?
              </h2>
              <p className="mb-8 leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                Create your free account and get a virtual number in under a minute.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-[10px] text-base font-bold transition-all hover:opacity-90 hover:-translate-y-0.5 active:scale-95"
                  style={{ background: "var(--primary)", color: "#09090d" }}
                >
                  Create Free Account
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="https://wa.me/2349049386397"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-[10px] text-base font-medium transition-all hover:-translate-y-0.5 active:scale-95"
                  style={{ border: "1px solid rgba(255,255,255,0.12)", color: "var(--muted-foreground)" }}
                >
                  Chat with Us
                </a>
              </div>
            </motion.div>
          </InView>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer
        className="pt-14 pb-8 px-4"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="max-w-6xl mx-auto">
          {/* Top columns */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-1">
              <Logo size="md" />
              <p className="text-sm mt-3 leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                Nigeria&apos;s most reliable virtual number platform. USA &amp; global OTP numbers delivered instantly.
              </p>
              <div className="flex items-center gap-3 mt-4">
                <a
                  href="https://chat.whatsapp.com/H3gMVzCwe5sFDYFb0HoKGL"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                  style={{ background: "rgba(0,229,160,0.12)", border: "1px solid rgba(0,229,160,0.20)" }}
                  aria-label="WhatsApp"
                >
                  <MessageSquare className="w-3.5 h-3.5" style={{ color: "var(--primary)" }} />
                </a>
                <a
                  href="https://t.me/abatilogs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                  style={{ background: "rgba(0,229,160,0.12)", border: "1px solid rgba(0,229,160,0.20)" }}
                  aria-label="Telegram"
                >
                  <Send className="w-3.5 h-3.5" style={{ color: "var(--primary)" }} />
                </a>
                <a
                  href="mailto:support@abatilogs.com"
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                  style={{ background: "rgba(0,229,160,0.12)", border: "1px solid rgba(0,229,160,0.20)" }}
                  aria-label="Email"
                >
                  <Mail className="w-3.5 h-3.5" style={{ color: "var(--primary)" }} />
                </a>
              </div>
            </div>

            {/* Platform */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--muted-foreground)" }}>
                Platform
              </p>
              <div className="space-y-2.5">
                {[
                  { label: "Dashboard", href: "/dashboard" },
                  { label: "Buy Numbers", href: "/register" },
                  { label: "SMS Inbox", href: "/dashboard/sms" },
                  { label: "Pricing", href: "/register" },
                ].map((l) => (
                  <Link
                    key={l.label}
                    href={l.href}
                    className="block text-sm transition-colors hover:text-foreground"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Company */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--muted-foreground)" }}>
                Company
              </p>
              <div className="space-y-2.5">
                {[
                  { label: "About Us", href: "/about" },
                  { label: "Support", href: "/support" },
                  { label: "Contact", href: "/contact" },
                  { label: "Refund Policy", href: "/refunds" },
                ].map((l) => (
                  <Link
                    key={l.label}
                    href={l.href}
                    className="block text-sm transition-colors hover:text-foreground"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Legal */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--muted-foreground)" }}>
                Legal
              </p>
              <div className="space-y-2.5">
                {[
                  { label: "Terms of Service", href: "/terms" },
                  { label: "Privacy Policy", href: "/privacy" },
                  { label: "Cookie Policy", href: "/privacy" },
                ].map((l) => (
                  <Link
                    key={l.label}
                    href={l.href}
                    className="block text-sm transition-colors hover:text-foreground"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
              {/* WhatsApp support CTA */}
              <a
                href="https://wa.me/2349049386397?text=Hi%2C%20I%20need%20help%20with%20Abati%20Logs"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-85"
                style={{ background: "rgba(0,229,160,0.12)", color: "var(--primary)", border: "1px solid rgba(0,229,160,0.22)" }}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                24/7 WhatsApp Support
              </a>
            </div>
          </div>

          {/* Bottom bar */}
          <div
            className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              © {new Date().getFullYear()} Abati Logs &amp; SMS. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                Built with ♥ for Nigeria
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Floating WhatsApp Support Button ──────────────────────────────────── */}
      <FloatingSupport />
    </div>
  );
}
