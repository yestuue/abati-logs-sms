"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ShoppingCart, MessageSquare, Settings,
  LogOut, Shield, BarChart3, Users, Server, Phone,
  CreditCard, ShoppingBag, Wallet, Archive, PackageSearch, BadgeDollarSign, Gift, User, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { signOut, useSession } from "next-auth/react";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "@/components/theme-provider";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const userNav: NavItem[] = [
  { label: "Dashboard",    href: "/dashboard",              icon: LayoutDashboard },
  { label: "Buy Number",   href: "/dashboard/buy",          icon: ShoppingCart },
  { label: "Social Logs",  href: "/dashboard/social",       icon: ShoppingBag },
  { label: "My Vault",     href: "/dashboard/orders",       icon: Archive },
  { label: "SMS Inbox",    href: "/dashboard/sms",          icon: MessageSquare },
  { label: "Wallet",       href: "/dashboard/wallet",       icon: Wallet },
  { label: "Referral Program", href: "/referrals",          icon: Gift },
  { label: "Transactions", href: "/dashboard/transactions", icon: CreditCard },
  { label: "Settings",     href: "/dashboard/settings",     icon: Settings },
];

const adminNav: NavItem[] = [
  { label: "Overview",   href: "/admin",             icon: LayoutDashboard },
  { label: "Servers",    href: "/admin/servers",     icon: Server },
  { label: "Numbers",    href: "/admin/numbers",     icon: Phone },
  { label: "Pricing Management", href: "/admin/pricing", icon: BadgeDollarSign },
  { label: "Services",   href: "/admin/services",    icon: MessageSquare },
  { label: "Inventory",  href: "/admin/inventory",   icon: PackageSearch },
  { label: "Users",      href: "/admin/users",       icon: Users },
  { label: "Revenue",    href: "/admin/revenue",     icon: BarChart3 },
];

interface SidebarProps {
  variant?: "user" | "admin";
  onNavigate?: () => void;
}

export function Sidebar({ variant = "user", onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const { data: session } = useSession();
  const nav = variant === "admin" ? adminNav : userNav;
  const [viewMode, setViewMode] = useState<"admin" | "customer">("customer");
  const isAdmin = session?.user?.role === "ADMIN";

  useEffect(() => {
    if (!isAdmin) return;
    const stored = window.localStorage.getItem("abati_view_mode");
    if (stored === "admin" || stored === "customer") {
      setViewMode(stored);
      return;
    }
    setViewMode(pathname.startsWith("/admin") ? "admin" : "customer");
  }, [isAdmin, pathname]);

  useEffect(() => {
    if (!isAdmin) return;
    window.localStorage.setItem("abati_view_mode", viewMode);
  }, [isAdmin, viewMode]);

  const isActive = (href: string) => {
    if (href === "/dashboard" || href === "/admin") return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside className="sidebar-gradient flex flex-col h-full border-r border-border/50">
      {isAdmin && (
        <div className="mx-3 mt-3 rounded-xl border-2 border-primary/35 bg-primary/10 p-3 shadow-md">
          <p className="text-[10px] font-bold text-center uppercase tracking-widest text-muted-foreground mb-2">
            View Mode
          </p>
          <div className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-card px-2.5 py-2">
            <div className="flex items-center gap-2 text-xs font-semibold">
              {viewMode === "admin" ? (
                <>
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span>Admin Workspace</span>
                </>
              ) : (
                <>
                  <User className="h-4 w-4 text-primary" />
                  <span>Customer View</span>
                </>
              )}
            </div>
            <Switch
              checked={viewMode === "admin"}
              onCheckedChange={(checked) => {
                const nextMode = checked ? "admin" : "customer";
                setViewMode(nextMode);
                onNavigate?.();
                window.location.assign(checked ? "/admin" : "/dashboard");
              }}
              aria-label="Toggle admin workspace view mode"
            />
          </div>
        </div>
      )}

      {/* Logo */}
      <div className="px-4 py-5 flex-shrink-0">
        <Logo size="md" />
        {variant === "admin" && (
          <div className="mt-2 flex items-center gap-1.5 px-1">
            <Shield className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">
              Abati Admin
            </span>
          </div>
        )}
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
              style={active ? {
                background: "rgba(0,229,160,0.12)",
                border: "1px solid rgba(0,229,160,0.22)",
                color: "var(--primary)",
              } : {}}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                  style={{ background: "oklch(0.68 0.22 278 / 0.20)", color: "var(--primary)" }}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* Footer: theme toggle + sign out */}
      <div className="p-3 space-y-1">
        {/* Theme Toggle Row */}
        <div
          className="flex items-center justify-between px-3 py-2.5 rounded-xl"
          style={{ background: "var(--accent)" }}
        >
          <span className="text-sm font-medium text-muted-foreground">
            {theme === "dark" ? "Dark Mode" : "Light Mode"}
          </span>
          <ThemeToggle />
        </div>

        {variant === "admin" && (
          <Link
            href="/dashboard"
            onClick={onNavigate}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
          >
            <LayoutDashboard className="w-4 h-4" />
            User Dashboard
          </Link>
        )}

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
