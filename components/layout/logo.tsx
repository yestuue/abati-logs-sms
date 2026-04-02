"use client";
import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Logo({ size = "md", className }: LogoProps) {
  const configs = {
    sm: { icon: 16, text: "text-base", gap: "gap-1.5" },
    md: { icon: 20, text: "text-lg",   gap: "gap-2" },
    lg: { icon: 26, text: "text-2xl",  gap: "gap-2.5" },
  };
  const c = configs[size];

  return (
    <div className={cn("flex items-center", c.gap, className)}>
      <div
        className="flex items-center justify-center rounded-xl flex-shrink-0"
        style={{
          width: c.icon + 12,
          height: c.icon + 12,
          background: "linear-gradient(135deg, oklch(0.68 0.22 278), oklch(0.53 0.24 278))",
          boxShadow: "0 2px 12px oklch(0.68 0.22 278 / 0.40)",
        }}
      >
        <Zap
          style={{ width: c.icon, height: c.icon }}
          className="text-white"
          strokeWidth={2.5}
        />
      </div>
      <span
        className={cn("font-extrabold tracking-tight leading-none", c.text)}
        style={{ fontFamily: "var(--font-heading)" }}
      >
        <span style={{ color: "var(--primary)" }}>Larry</span>
        <span style={{ color: "var(--foreground)" }}>Digitals</span>
      </span>
    </div>
  );
}
