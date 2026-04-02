"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Sidebar } from "./sidebar";
import { AppHeader } from "./app-header";

interface AppShellProps {
  children: React.ReactNode;
  variant?: "user" | "admin";
  walletBalance?: number;
  walletCurrency?: "NGN" | "USD";
  userName?: string;
  userEmail?: string;
  userRole?: string;
  verifyBanner?: React.ReactNode;
}

export function AppShell({
  children,
  variant = "user",
  walletBalance = 0,
  walletCurrency = "NGN",
  userName,
  userEmail,
  userRole,
  verifyBanner,
}: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on route change / escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDrawerOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Prevent scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* ── Desktop Sidebar ──────────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col w-[240px] h-screen fixed left-0 top-0 z-30">
        <Sidebar variant={variant} />
      </div>

      {/* ── Mobile Drawer Overlay ────────────────────────────────────────── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
              onClick={() => setDrawerOpen(false)}
            />
            {/* Drawer panel */}
            <motion.div
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-[260px] flex flex-col"
              style={{ background: "var(--card)", borderRight: "1px solid var(--border)" }}
            >
              {/* Close button */}
              <button
                onClick={() => setDrawerOpen(false)}
                className="absolute top-3 right-3 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
              <Sidebar variant={variant} onNavigate={() => setDrawerOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Top Header ───────────────────────────────────────────────────── */}
      <AppHeader
        variant={variant}
        walletBalance={walletBalance}
        walletCurrency={walletCurrency}
        userName={userName}
        userEmail={userEmail}
        userRole={userRole}
        onHamburger={() => setDrawerOpen(true)}
      />

      {/* ── Verify Banner ────────────────────────────────────────────────── */}
      {verifyBanner && (
        <div className="lg:pl-[240px]">{verifyBanner}</div>
      )}

      {/* ── Page Content ─────────────────────────────────────────────────── */}
      <main className="lg:pl-[240px] pt-14 pb-20 lg:pb-8">
        <div className="p-4 md:p-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
