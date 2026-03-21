"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  MessageSquare,
  Settings,
  LogOut,
  Shield,
  BarChart3,
  Users,
  Server,
  Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { signOut } from "next-auth/react";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const userNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Buy Number", href: "/dashboard/buy", icon: ShoppingCart },
  { label: "SMS Inbox", href: "/dashboard/sms", icon: MessageSquare },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

const adminNav: NavItem[] = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Servers", href: "/admin/servers", icon: Server },
  { label: "Numbers", href: "/admin/numbers", icon: Phone },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Revenue", href: "/admin/revenue", icon: BarChart3 },
];

interface SidebarProps {
  variant?: "user" | "admin";
  onNavigate?: () => void;
}

export function Sidebar({ variant = "user", onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const nav = variant === "admin" ? adminNav : userNav;

  const isActive = (href: string) => {
    if (href === "/dashboard" || href === "/admin") {
      return pathname === href;
    }
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
              Admin Panel
            </span>
          </div>
        )}
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
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
                  ? "bg-primary/15 text-primary border border-primary/20"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon
                className={cn("w-4 h-4 flex-shrink-0", active && "text-primary")}
              />
              {item.label}
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* Footer */}
      <div className="p-3 space-y-1">
        {variant === "admin" && (
          <Link
            href="/dashboard"
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
