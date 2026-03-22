"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingCart, MessageSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Home",    href: "/dashboard",          icon: LayoutDashboard },
  { label: "Buy",     href: "/dashboard/buy",       icon: ShoppingCart },
  { label: "SMS",     href: "/dashboard/sms",       icon: MessageSquare },
  { label: "Account", href: "/dashboard/settings",  icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 flex border-t"
      style={{
        background: "#ffffff",
        borderColor: "#e5e7eb",
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
              "flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
              active ? "text-[#00E5A0]" : "text-gray-400 hover:text-gray-600"
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
