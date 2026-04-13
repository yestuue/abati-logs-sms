import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export function Logo({ size = "md", className }: LogoProps) {
  const heights = { sm: 28, md: 36, lg: 48 };
  const h = heights[size];

  return (
    <div className={cn("flex items-center", className)}>
      <Image
        src="/logo.png"
        alt="Abati Digital"
        height={h}
        width={h * 4}
        style={{ height: h, width: "auto" }}
        priority
      />
    </div>
  );
}
