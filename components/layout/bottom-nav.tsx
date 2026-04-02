"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingCart, ShoppingBag, Archive, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Home",    href: "/dashboard",          icon: LayoutDashboard },
  { label: "Numbers", href: "/dashboard/buy",       icon: ShoppingCart },
  { label: "Social",  href: "/dashboard/social",    icon: ShoppingBag },
  { label: "Vault",   href: "/dashboard/orders",    icon: Archive },
  { label: "Wallet",  href: "/dashboard/wallet",    icon: Wallet },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 flex border-t"
      style={{
        background: "var(--card)",
        borderColor: "var(--border)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {nav.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className={cn("w-5 h-5", active && "stroke-[2.5px]")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
