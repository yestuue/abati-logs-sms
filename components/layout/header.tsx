"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { Menu, X, Wallet, Bell, LogOut, User, Shield, ChevronDown } from "lucide-react";
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
import { cn } from "@/lib/utils";

interface HeaderProps {
  variant?: "user" | "admin";
}

export function Header({ variant = "user" }: HeaderProps) {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "U";

  const walletBalance = session?.user?.walletBalance ?? 0;
  const walletCurrency = (session?.user?.walletCurrency ?? "NGN") as "NGN" | "USD";

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col w-[240px] h-screen fixed left-0 top-0 z-30">
        <Sidebar variant={variant} />
      </div>

      {/* Top Header Bar */}
      <header className="sticky top-0 z-20 h-14 flex items-center border-b border-border/50 bg-background/80 backdrop-blur-md px-4 lg:pl-[calc(240px+1rem)]">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden mr-2"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Mobile Logo */}
        <div className="lg:hidden">
          <Logo size="sm" />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Wallet pill */}
          {variant === "user" && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20">
              <Wallet className="w-3.5 h-3.5 text-primary" />
              <span className="text-sm font-semibold text-primary">
                {formatCurrency(walletBalance, walletCurrency)}
              </span>
            </div>
          )}

          {/* Profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 h-9 px-2 rounded-xl hover:bg-accent"
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
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
                  <p className="font-semibold text-foreground text-sm">
                    {session?.user?.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {session?.user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Wallet (mobile) */}
              {variant === "user" && (
                <DropdownMenuItem className="sm:hidden">
                  <Wallet className="w-4 h-4" />
                  Wallet: {formatCurrency(walletBalance, walletCurrency)}
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

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="absolute left-0 top-0 h-full w-[240px] shadow-xl">
            <div className="flex items-center justify-end px-3 py-3 border-b border-border/50 bg-card">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="h-[calc(100%-52px)]">
              <Sidebar variant={variant} onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
