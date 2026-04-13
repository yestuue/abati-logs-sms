"use client";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/layout/logo";
import { FloatingSupport } from "@/components/landing/floating-support";
import {
  ArrowRight, CheckCircle, Zap, Globe, MessageSquare, Shield,
  Star, Users, Phone, Clock, BadgeCheck, TrendingUp,
  Send, Mail, HeartHandshake, ShoppingBag, CreditCard,
} from "lucide-react";

// ── Animation primitives ──────────────────────────────────────────────────────
const fadeUp = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
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

// ── Data ───────────────────────────────────────────────────────────────────────
const features = [
  { icon: Zap,           title: "Instant Activation",  description: "Get a virtual number in seconds, start receiving OTPs immediately." },
  { icon: Globe,         title: "Two Server System",   description: "Server 1 for USA (+1) numbers. Server 2 for global coverage across 50+ countries." },
  { icon: MessageSquare, title: "Real-Time SMS Inbox", description: "OTPs and messages routed directly to your private dashboard." },
  { icon: Shield,        title: "Secure Wallet",       description: "Fund your wallet via Paystack and use it across all purchases." },
];

const services = [
  {
    icon: Phone,
    emoji: "📱",
    title: "Virtual Numbers",
    description: "Receive OTPs for WhatsApp, Telegram, Google, and 50+ services instantly. USA numbers via Server 1, global numbers via Server 2.",
    color: "#00E5A0",
    tags: ["WhatsApp", "Telegram", "Google", "USA & Global"],
  },
  {
    icon: ShoppingBag,
    emoji: "📲",
    title: "Social Logs",
    description: "High-quality Facebook, Instagram, TikTok, Twitter/X, and Gmail accounts with aged history. Phone-verified and ready to use.",
    color: "#6366f1",
    tags: ["Facebook", "Instagram", "TikTok", "Twitter/X"],
  },
  {
    icon: CreditCard,
    emoji: "🏦",
    title: "Business Tools",
    description: "Verification solutions for PayPal, Stripe, and global business platforms. Get verified accounts for your business operations.",
    color: "#f59e0b",
    tags: ["PayPal", "Stripe", "Business", "Verified"],
  },
];

const trustStats = [
  { icon: Users,      value: "2,500+",  label: "Active Users",   countTo: 2500,  suffix: "+" },
  { icon: Phone,      value: "10,000+", label: "Numbers Issued", countTo: 10000, suffix: "+" },
  { icon: BadgeCheck, value: "99.9%",   label: "Uptime",         countTo: null,  suffix: "" },
  { icon: Clock,      value: "< 5s",    label: "OTP Delivery",   countTo: null,  suffix: "" },
];

const testimonials = [
  {
    name: "Adebayo Okonkwo", handle: "@adebayo_ok", avatar: "AO", stars: 5,
    text: "Abati Logs is hands down the best virtual number service I've used. Got my OTP in under 3 seconds. No stress, no lag. 100% recommend!",
    tag: "Verified User",
  },
  {
    name: "Chiamaka Ezeh", handle: "@chiamaka_e", avatar: "CE", stars: 5,
    text: "I needed a USA number for verification and Server 1 delivered instantly. The wallet top-up via Paystack was super smooth too.",
    tag: "Server 1 User",
  },
  {
    name: "Tunde Fashola", handle: "@tunde_f", avatar: "TF", stars: 5,
    text: "Been using this for 3 months now. The dashboard is clean, SMS arrives fast, and the support team responds on WhatsApp within minutes.",
    tag: "Power User",
  },
  {
    name: "Kelechi Nwosu", handle: "@kel_nw", avatar: "KN", stars: 5,
    text: "Global numbers from Server 2 are perfect for my international accounts. The platform just works — no downtime, no excuses.",
    tag: "Server 2 User",
  },
  {
    name: "Fatimah Aliyu", handle: "@fatimah_a", avatar: "FA", stars: 5,
    text: "The real-time SMS inbox is a game changer. I can see OTPs the moment they arrive. Clean UI, great service. Keep it up!",
    tag: "Verified User",
  },
  {
    name: "Emeka Obi", handle: "@emeka_obi", avatar: "EO", stars: 5,
    text: "Cheapest and most reliable virtual number service in Nigeria. I've tried others but Abati Logs is superior in every way.",
    tag: "Long-term User",
  },
];

// ── Mint green helpers ────────────────────────────────────────────────────────
const MINT      = "oklch(0.80 0.19 162)";
const MINT_DARK = "oklch(0.68 0.17 162)";

export default function LandingPage() {
  return (
    <div
      className="min-h-screen overflow-x-hidden relative"
      style={{
        background: "radial-gradient(ellipse at top center, #0d1a12 0%, #050a07 40%, #000000 100%)",
      }}
    >
      {/* ── Faint grid overlay ───────────────────────────────────────────────── */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,229,160,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,229,160,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse at top, black 0%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse at top, black 0%, transparent 70%)",
        }}
        aria-hidden
      />

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-50 border-b relative"
        style={{
          borderColor: "rgba(0,229,160,0.10)",
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(14px)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" aria-label="Abati Digital home" className="flex items-center">
            <Logo size="sm" />
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <ThemeToggle className="hidden sm:flex" />
            {/* Glass-morphism Sign In */}
            <Link
              href="/login"
              className="px-3 sm:px-4 py-2 text-sm font-medium transition-all rounded-lg border hover:bg-white/5"
              style={{
                border: "1px solid rgba(0,229,160,0.25)",
                color: MINT,
                backdropFilter: "blur(8px)",
              }}
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 sm:px-5 py-2 rounded-[9px] text-sm font-bold transition-all hover:opacity-88 active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${MINT}, ${MINT_DARK})`,
                color: "#09090d",
              }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative px-4 pt-16 pb-16 sm:pt-24 sm:pb-20 overflow-hidden z-10">
        {/* Mint glow behind hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
          className="absolute inset-0 pointer-events-none"
        >
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2"
            style={{
              width: "min(800px, 100vw)",
              height: 520,
              background: `radial-gradient(ellipse, ${MINT}18 0%, transparent 68%)`,
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
                background: `${MINT}14`,
                border: `1px solid ${MINT}38`,
                color: MINT,
              }}
            >
              <Zap className="w-3 h-3" />
              Your All-in-One Digital Communication &amp; Verification Hub
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            className="text-[2.4rem] sm:text-5xl lg:text-[4rem] leading-[1.12] mb-5 px-2 text-white"
            style={{ fontFamily: "var(--font-heading)", fontWeight: 800 }}
          >
            Virtual Numbers &amp; Aged Profiles
            <br />
            <motion.span variants={fadeUp} style={{ color: MINT }}>
              for Business
            </motion.span>
          </motion.h1>

          {/* Sub-text */}
          <motion.p
            variants={fadeUp}
            className="text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-8 px-2"
            style={{ color: "rgba(255,255,255,0.62)" }}
          >
            Instant access to USA &amp; global virtual numbers for SMS verification. Pre-warmed profiles for marketing
            and outreach. Fast delivery, reliable support.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            variants={fadeUp}
            className="flex flex-col xs:flex-row gap-3 justify-center mb-8 px-4"
          >
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-[10px] text-[15px] font-bold transition-all hover:opacity-90 hover:-translate-y-0.5 active:scale-95"
              style={{ background: `linear-gradient(135deg, ${MINT}, ${MINT_DARK})`, color: "#09090d" }}
            >
              Create Free Account
              <ArrowRight className="w-4 h-4" />
            </Link>
            {/* Glass-morphism Sign In */}
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-[10px] text-[15px] font-medium transition-all hover:-translate-y-0.5 active:scale-95"
              style={{
                border: `1px solid rgba(0,229,160,0.30)`,
                color: "rgba(255,255,255,0.75)",
                backdropFilter: "blur(8px)",
                background: "rgba(0,229,160,0.05)",
              }}
            >
              Sign In
            </Link>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            variants={fadeIn}
            className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            {["No credit card required", "Instant setup", "24/7 support"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: MINT }} />
                {t}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── Trust Stats Row ──────────────────────────────────────────────────── */}
      <section
        className="relative z-10 py-10 px-4 border-y"
        style={{ borderColor: "rgba(0,229,160,0.08)", background: "rgba(0,0,0,0.30)" }}
      >
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
                      style={{ background: `${MINT}12`, border: `1px solid ${MINT}28` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: MINT }} />
                    </div>
                    <p className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                      {s.countTo !== null
                        ? <CountUpNumber end={s.countTo} suffix={s.suffix} />
                        : s.value}
                    </p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.48)" }}>{s.label}</p>
                  </motion.div>
                );
              })}
            </div>
          </InView>
        </div>
      </section>

      {/* ── Our Services ─────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-16 sm:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <InView>
            <div className="text-center mb-12">
              <motion.p
                variants={fadeIn}
                className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ color: MINT }}
              >
                Our Services
              </motion.p>
              <motion.h2
                variants={fadeUp}
                className="text-3xl sm:text-[2.6rem] mb-3 text-white"
                style={{ fontFamily: "var(--font-heading)", fontWeight: 800 }}
              >
                Everything Digital, All in One Place
              </motion.h2>
              <motion.p
                variants={fadeUp}
                className="text-sm sm:text-base max-w-xl mx-auto"
                style={{ color: "rgba(255,255,255,0.52)" }}
              >
                From instant OTP numbers to premium social accounts — we have it all.
              </motion.p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {services.map((s, i) => {
                return (
                  <motion.div
                    key={s.title}
                    variants={scaleIn}
                    transition={{ delay: i * 0.08 }}
                    className="rounded-[18px] p-6 flex flex-col gap-4 hover:scale-[1.02] transition-transform cursor-default"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: `1px solid ${s.color}28`,
                      boxShadow: `0 0 28px ${s.color}0a`,
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: `${s.color}18`, border: `1px solid ${s.color}30` }}
                    >
                      {s.emoji}
                    </div>
                    <div>
                      <h3
                        className="text-base font-bold mb-2 text-white"
                        style={{ fontFamily: "var(--font-heading)" }}
                      >
                        {s.title}
                      </h3>
                      <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.52)" }}>
                        {s.description}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-auto">
                      {s.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: `${s.color}18`, color: s.color, border: `1px solid ${s.color}28` }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </InView>
        </div>
      </section>


      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-16 sm:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <InView>
            <div className="text-center mb-12 sm:mb-16">
              <motion.h2
                variants={fadeUp}
                className="text-3xl sm:text-[2.6rem] mb-3 sm:mb-4 text-white"
                style={{ fontFamily: "var(--font-heading)", fontWeight: 800 }}
              >
                Everything You Need
              </motion.h2>
              <motion.p
                variants={fadeUp}
                className="text-sm sm:text-base"
                style={{ color: "rgba(255,255,255,0.52)" }}
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
                      background: "rgba(255,255,255,0.03)",
                      border: `1px solid ${MINT}18`,
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                      style={{ background: `${MINT}14`, border: `1px solid ${MINT}28` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: MINT }} />
                    </div>
                    <h3
                      className="text-base mb-2 text-white"
                      style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}
                    >
                      {f.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.52)" }}>
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
      <section className="relative z-10 py-16 sm:py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <InView className="text-center">
            <motion.h2
              variants={fadeUp}
              className="text-3xl sm:text-[2.6rem] mb-12 text-white"
              style={{ fontFamily: "var(--font-heading)", fontWeight: 800 }}
            >
              Up and running in 3 steps
            </motion.h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-center">
              {[
                { step: "01", title: "Register",      desc: "Sign up free in under 60 seconds — no credit card required." },
                { step: "02", title: "Fund Wallet",   desc: "Top up via Paystack — cards, bank transfer, or USSD." },
                { step: "03", title: "Use Services",  desc: "Buy numbers, get OTPs, or browse premium social logs instantly." },
              ].map((s) => (
                <motion.div key={s.step} variants={fadeUp} className="flex flex-col items-center">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-sm font-bold"
                    style={{
                      background: `${MINT}14`,
                      border: `1px solid ${MINT}30`,
                      color: MINT,
                      fontFamily: "var(--font-heading)",
                    }}
                  >
                    {s.step}
                  </div>
                  <h3 className="font-semibold mb-1.5 text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    {s.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.52)" }}>{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </InView>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-16 sm:py-20 px-4">
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
                className="text-3xl sm:text-[2.6rem] mb-3 text-white"
                style={{ fontFamily: "var(--font-heading)", fontWeight: 800 }}
              >
                Loved by Thousands
              </motion.h2>
              <motion.p
                variants={fadeUp}
                className="text-sm sm:text-base"
                style={{ color: "rgba(255,255,255,0.52)" }}
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
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${MINT}18`,
                  }}
                >
                  <div className="flex gap-0.5">
                    {[...Array(t.stars)].map((_, j) => (
                      <Star key={j} className="w-3.5 h-3.5 fill-current" style={{ color: "#f59e0b" }} />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed flex-1 text-white/80">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 pt-2 border-t" style={{ borderColor: `${MINT}14` }}>
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: `${MINT}18`, color: MINT }}
                    >
                      {t.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate text-white">{t.name}</p>
                      <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.40)" }}>{t.handle}</p>
                    </div>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: `${MINT}14`, color: MINT, border: `1px solid ${MINT}28` }}
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

      {/* ── Why Abati Logs ───────────────────────────────────────────────────── */}
      <section className="relative z-10 py-16 sm:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <InView>
            <motion.div
              variants={scaleIn}
              className="rounded-[20px] p-8 sm:p-12"
              style={{
                background: "rgba(0,229,160,0.04)",
                border: `1px solid ${MINT}20`,
              }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <div>
                  <motion.h2
                    variants={fadeUp}
                    className="text-3xl sm:text-4xl mb-4 text-white"
                    style={{ fontFamily: "var(--font-heading)", fontWeight: 800 }}
                  >
                    Why Abati Logs?
                  </motion.h2>
                  <motion.p
                    variants={fadeUp}
                    className="text-sm sm:text-base mb-6 leading-relaxed"
                    style={{ color: "rgba(255,255,255,0.55)" }}
                  >
                    Built specifically for the Nigerian market with global reach.
                    Fast delivery, honest pricing, and real support — no bots, no delays.
                  </motion.p>
                  <motion.div variants={staggerContainer} className="space-y-3">
                    {[
                      "Paystack-powered wallet — instant funding",
                      "Two dedicated servers for redundancy",
                      "WhatsApp support available 24/7",
                      "Numbers &amp; logs delivered in under 5 seconds",
                      "NGN &amp; USD pricing supported",
                    ].map((item) => (
                      <motion.div key={item} variants={fadeUp} className="flex items-center gap-3 text-sm text-white/80">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: MINT }} />
                        <span dangerouslySetInnerHTML={{ __html: item }} />
                      </motion.div>
                    ))}
                  </motion.div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: TrendingUp,     value: "₦500",  label: "Starting from",  sub: "Per number" },
                    { icon: Globe,          value: "50+",   label: "Countries",      sub: "Global coverage" },
                    { icon: Clock,          value: "< 5s",  label: "OTP Speed",      sub: "Real-time delivery" },
                    { icon: HeartHandshake, value: "24/7",  label: "Support",        sub: "WhatsApp & chat" },
                  ].map((s) => {
                    const Icon = s.icon;
                    return (
                      <motion.div
                        key={s.label}
                        variants={scaleIn}
                        className="rounded-2xl p-4 text-center"
                        style={{ background: `${MINT}08`, border: `1px solid ${MINT}18` }}
                      >
                        <Icon className="w-6 h-6 mx-auto mb-2" style={{ color: MINT }} />
                        <p className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>{s.value}</p>
                        <p className="text-xs font-semibold mt-0.5 text-white/70">{s.label}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.40)" }}>{s.sub}</p>
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
      <section className="relative z-10 py-16 sm:py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <InView>
            <motion.div
              variants={scaleIn}
              className="rounded-[20px] p-10 sm:p-14 text-center"
              style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${MINT}22` }}
            >
              <h2
                className="text-3xl sm:text-4xl mb-4 text-white"
                style={{ fontFamily: "var(--font-heading)", fontWeight: 800 }}
              >
                Ready to Get Started?
              </h2>
              <p className="mb-8 leading-relaxed" style={{ color: "rgba(255,255,255,0.52)" }}>
                Create your free account and get a virtual number in under a minute.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-[10px] text-base font-bold transition-all hover:opacity-90 hover:-translate-y-0.5 active:scale-95"
                  style={{ background: `linear-gradient(135deg, ${MINT}, ${MINT_DARK})`, color: "#09090d" }}
                >
                  Create Free Account
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="https://api.whatsapp.com/send?phone=2349049386397"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-[10px] text-base font-medium transition-all hover:-translate-y-0.5 active:scale-95"
                  style={{ border: `1px solid ${MINT}28`, color: MINT, background: `${MINT}08` }}
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
        className="relative z-10 pt-14 pb-8 px-4"
        style={{ borderTop: `1px solid ${MINT}14` }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-1">
              <Logo size="md" />
              <p className="text-sm mt-3 leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                Nigeria&apos;s reliable virtual number &amp; digital account platform. Delivered instantly.
              </p>
              <div className="flex items-center gap-3 mt-4">
                {[
                  { href: "https://chat.whatsapp.com/H3gMVzCwe5sFDYFb0HoKGL", icon: MessageSquare, label: "WhatsApp" },
                  { href: "https://t.me/abatilogs", icon: Send, label: "Telegram" },
                  { href: "mailto:support@abatilogs.com", icon: Mail, label: "Email" },
                ].map(({ href, icon: Icon, label }) => (
                  <a
                    key={label}
                    href={href}
                    target={href.startsWith("mailto") ? undefined : "_blank"}
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                    style={{ background: `${MINT}14`, border: `1px solid ${MINT}24` }}
                    aria-label={label}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: MINT }} />
                  </a>
                ))}
              </div>
            </div>

            {/* Platform */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>
                Platform
              </p>
              <div className="space-y-2.5">
                {[
                  { label: "Dashboard",    href: "/dashboard" },
                  { label: "Buy Numbers",  href: "/register" },
                  { label: "Social Logs",  href: "/register" },
                  { label: "SMS Inbox",    href: "/dashboard/sms" },
                ].map((l) => (
                  <Link
                    key={l.label}
                    href={l.href}
                    className="block text-sm transition-colors hover:text-white"
                    style={{ color: "rgba(255,255,255,0.45)" }}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Company */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>
                Company
              </p>
              <div className="space-y-2.5">
                {[
                  { label: "About", href: "#" },
                  { label: "Contact", href: "mailto:support@abatilogs.com" },
                  { label: "Privacy Policy", href: "/privacy" },
                  { label: "Terms of Service", href: "/terms" },
                ].map((l) =>
                  l.href.startsWith("mailto:") ? (
                    <a
                      key={l.label}
                      href={l.href}
                      className="block text-sm transition-colors hover:text-white"
                      style={{ color: "rgba(255,255,255,0.45)" }}
                    >
                      {l.label}
                    </a>
                  ) : (
                    <Link
                      key={l.label}
                      href={l.href}
                      className="block text-sm transition-colors hover:text-white"
                      style={{ color: "rgba(255,255,255,0.45)" }}
                    >
                      {l.label}
                    </Link>
                  )
                )}
              </div>
            </div>

            {/* Support */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>
                Support
              </p>
              <div className="space-y-2.5">
                {[
                  { label: "WhatsApp Chat",  href: "https://api.whatsapp.com/send?phone=2349049386397" },
                  { label: "WhatsApp Group", href: "https://chat.whatsapp.com/H3gMVzCwe5sFDYFb0HoKGL" },
                  { label: "Telegram",       href: "https://t.me/abatilogs" },
                  { label: "Email Us",       href: "mailto:support@abatilogs.com" },
                ].map((l) => (
                  <a
                    key={l.label}
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm transition-colors hover:text-white"
                    style={{ color: "rgba(255,255,255,0.45)" }}
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <p
            className="mb-8 max-w-3xl text-center text-[11px] leading-relaxed sm:text-left sm:text-xs mx-auto sm:mx-0"
            style={{ color: "rgba(255,255,255,0.42)" }}
          >
            Abati Digital is an independent provider. We are not affiliated with Meta, Google, TikTok, or any social
            platform. Users must comply with all third-party Terms of Service.
          </p>

          {/* Bottom bar */}
          <div
            className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ borderTop: `1px solid ${MINT}10` }}
          >
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>
              © {new Date().getFullYear()} Abati Digital. All rights reserved.
            </p>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: MINT }}>
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: MINT }}
              />
              All systems operational
            </div>
          </div>
        </div>
      </footer>

      <FloatingSupport />
    </div>
  );
}
