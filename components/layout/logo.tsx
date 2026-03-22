import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export function Logo({ size = "md", showText = true, className }: LogoProps) {
  const sizes = {
    sm: { icon: 24, text: "text-sm" },
    md: { icon: 32, text: "text-base" },
    lg: { icon: 40, text: "text-xl" },
  };
  const s = sizes[size];

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {/* Icon mark */}
      <div
        className="relative flex items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg glow-brand flex-shrink-0"
        style={{ width: s.icon, height: s.icon }}
      >
        <svg
          width={s.icon * 0.6}
          height={s.icon * 0.6}
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Signal / message icon */}
          <path
            d="M3 4C3 2.9 3.9 2 5 2H15C16.1 2 17 2.9 17 4V12C17 13.1 16.1 14 15 14H11L7 18V14H5C3.9 14 3 13.1 3 12V4Z"
            fill="white"
            fillOpacity="0.9"
          />
          <circle cx="7" cy="8" r="1" fill="oklch(0.55 0.14 162)" />
          <circle cx="10" cy="8" r="1" fill="oklch(0.55 0.14 162)" />
          <circle cx="13" cy="8" r="1" fill="oklch(0.55 0.14 162)" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className={cn("font-bold text-foreground tracking-tight", s.text)}>
            Abati Logs
          </span>
          <span className="text-[10px] text-muted-foreground font-medium tracking-widest uppercase">
            & SMS
          </span>
        </div>
      )}
    </div>
  );
}
