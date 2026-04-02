"use client";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Wallet, LogOut, User, Shield, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "./logo";
import { Sidebar } from "./sidebar";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

interface HeaderProps {
  variant?: "user" | "admin";
}

export function Header({ variant = "user" }: HeaderProps) {
  const { data: session } = useSession();

  const initials =
    session?.user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "U";

  const walletBalance = session?.user?.walletBalance ?? 0;
  const walletCurrency = (session?.user?.walletCurrency ?? "NGN") as "NGN" | "USD";

  return (
    <>
      {/* Desktop Sidebar — hidden on mobile (BottomNav handles mobile nav) */}
      <div className="hidden lg:flex flex-col w-[240px] h-screen fixed left-0 top-0 z-30">
        <Sidebar variant={variant} />
      </div>

      {/* Top Header Bar */}
      <header
        className="sticky top-0 z-20 h-14 flex items-center border-b px-4 lg:pl-[calc(240px+1.5rem)]"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        {/* Mobile: Logo on the left */}
        <div className="lg:hidden">
          <Logo size="sm" />
        </div>

        <div className="flex-1" />

        {/* Right side controls */}
        <div className="flex items-center gap-1">
          {/* Wallet balance pill (user dashboard only) */}
          {variant === "user" && (
            <div
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold text-primary"
              style={{
                background: "oklch(0.68 0.22 278 / 0.10)",
                border: "1px solid oklch(0.68 0.22 278 / 0.25)",
              }}
            >
              <Wallet className="w-3.5 h-3.5" />
              {formatCurrency(walletBalance, walletCurrency)}
            </div>
          )}

          <ThemeToggle />

          {/* Profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 h-9 px-2 rounded-xl"
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback
                    className="text-xs font-bold text-primary"
                    style={{ background: "oklch(0.68 0.22 278 / 0.15)" }}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">
                  {session?.user?.name ?? "User"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <p className="font-semibold text-sm">{session?.user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {session?.user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Wallet (mobile only — desktop shows pill above) */}
              {variant === "user" && (
                <DropdownMenuItem className="sm:hidden">
                  <Wallet className="w-4 h-4" />
                  {formatCurrency(walletBalance, walletCurrency)}
                </DropdownMenuItem>
              )}

              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                  <User className="w-4 h-4" />
                  Profile Settings
                </Link>
              </DropdownMenuItem>

              {session?.user?.role === "ADMIN" && (
                <DropdownMenuItem asChild>
                  <Link href="/admin">
                    <Shield className="w-4 h-4" />
                    Admin Panel
                  </Link>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </>
  );
}
