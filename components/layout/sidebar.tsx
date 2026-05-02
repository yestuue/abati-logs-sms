"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ShoppingCart, MessageSquare, Settings,
  LogOut, Shield, BarChart3, Users, Server, Phone,
  CreditCard, ShoppingBag, Wallet, Archive, PackageSearch, BadgeDollarSign, Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { signOut } from "next-auth/react";
import { Separator } from "@/components/ui/separator";
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
  { label: "Delivery Logs",  href: "/dashboard/social",       icon: ShoppingBag },
  { label: "My Vault",     href: "/dashboard/orders",       icon: Archive },
  { label: "SMS Inbox",    href: "/dashboard/sms",          icon: MessageSquare },
  { label: "Wallet",       href: "/dashboard/wallet",       icon: Wallet },
  { label: "Fund Wallet",  href: "/dashboard/wallet",       icon: BadgeDollarSign },
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
  canAccessAdmin?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({ variant = "user", canAccessAdmin = false, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const nav = variant === "admin" ? adminNav : userNav;

  const isActive = (href: string) => {
    if (href === "/dashboard" || href === "/admin") return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside className="sidebar-gradient flex flex-col h-full border-r border-border/50">
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

        {/* Admin Mode Toggle */}
        {canAccessAdmin && (
          <Link
            href={variant === "admin" ? "/dashboard" : "/admin"}
            onClick={onNavigate}
            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group"
            style={{ 
              background: variant === "admin" ? "oklch(0.68 0.22 278 / 0.15)" : "var(--accent)",
              border: variant === "admin" ? "1px solid oklch(0.68 0.22 278 / 0.30)" : "1px solid transparent"
            }}
          >
            <div className="flex items-center gap-3">
              <Shield className={cn(
                "w-4 h-4 transition-colors",
                variant === "admin" ? "text-primary" : "text-muted-foreground"
              )} />
              <span className={variant === "admin" ? "text-primary" : "text-muted-foreground"}>
                Admin Mode
              </span>
            </div>
            <div 
              className={cn(
                "w-8 h-4 rounded-full relative transition-all duration-300",
                variant === "admin" ? "bg-primary" : "bg-muted-foreground/30"
              )}
            >
              <div 
                className={cn(
                  "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all duration-300 shadow-sm",
                  variant === "admin" ? "left-4.5" : "left-0.5"
                )}
                style={{ left: variant === "admin" ? "calc(100% - 14px)" : "2px" }}
              />
            </div>
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
