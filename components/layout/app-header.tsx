"use client";
import { signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Wallet, LogOut, User, Shield, ChevronDown, Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "./logo";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

interface AppHeaderProps {
  variant?: "user" | "admin";
  walletBalance?: number;
  walletCurrency?: "NGN" | "USD";
  userName?: string;
  userEmail?: string;
  userRole?: string;
  onHamburger?: () => void;
}

export function AppHeader({
  variant = "user",
  walletBalance = 0,
  walletCurrency = "NGN",
  userName,
  userEmail,
  userRole,
  onHamburger,
}: AppHeaderProps) {
  const initials =
    userName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "U";

  return (
    <header
      className="sticky top-0 z-20 h-14 flex items-center border-b px-4 lg:pl-[calc(240px+1.5rem)]"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      {variant === "admin" && (
        <div className="hidden lg:flex items-center shrink-0 mr-4">
          <Link href="/admin" className="flex items-center" aria-label="Abati Digital — Admin home">
            <Logo size="sm" />
          </Link>
        </div>
      )}
      {/* Mobile: hamburger + logo */}
      <div className="lg:hidden flex items-center gap-2">
        <button
          onClick={onHamburger}
          aria-label="Open menu"
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Logo size="sm" />
      </div>

      <div className="flex-1" />

      {/* Right side controls */}
      <div className="flex items-center gap-1">
        {/* Wallet balance pill — user dashboard only */}
        {variant === "user" && (
          <Link
            href="/dashboard/wallet"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
            style={{
              background: "rgba(0,229,160,0.10)",
              border: "1px solid rgba(0,229,160,0.25)",
              color: "var(--primary)",
            }}
          >
            <Wallet className="w-3.5 h-3.5" />
            {formatCurrency(walletBalance, walletCurrency)}
          </Link>
        )}

        <ThemeToggle />

        {/* Profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 h-9 px-2 rounded-xl">
              <Avatar className="h-7 w-7">
                <AvatarFallback
                  className="text-xs font-bold"
                  style={{
                    background: "rgba(0,229,160,0.15)",
                    color: "var(--primary)",
                  }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">
                {userName ?? "User"}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-[100] bg-background border shadow-xl w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <p className="font-semibold text-sm">{userName}</p>
                <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                <p className="text-[11px] font-semibold text-primary pt-0.5">
                  {userRole === "ADMIN" ? "Abati Admin" : "Abati User"}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {variant === "user" && (
              <DropdownMenuItem className="sm:hidden" asChild>
                <Link href="/dashboard/wallet">
                  <Wallet className="w-4 h-4" />
                  {formatCurrency(walletBalance, walletCurrency)}
                </Link>
              </DropdownMenuItem>
            )}

            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">
                <User className="w-4 h-4" />
                Profile Settings
              </Link>
            </DropdownMenuItem>

            {(userRole === "ADMIN" || isPrivilegedAdminEmail(userEmail)) && (
              <DropdownMenuItem asChild>
                <Link href="/admin">
                  <Shield className="w-4 h-4" />
                  Open admin panel
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
  );
}
