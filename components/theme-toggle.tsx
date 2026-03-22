"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className={cn(
        "w-9 h-9 flex items-center justify-center rounded-xl transition-all",
        "hover:bg-white/10 text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
    </button>
  );
}
