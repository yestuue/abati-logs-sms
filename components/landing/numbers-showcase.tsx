"use client";
import { useState } from "react";
import { Phone, Copy, Check } from "lucide-react";

type Filter = "all" | "server1" | "server2";

const NUMBERS = [
  { number: "+1 (202) 555-0147", country: "United States", server: "server1" as const },
  { number: "+1 (310) 555-0192", country: "United States", server: "server1" as const },
  { number: "+1 (646) 555-0183", country: "United States", server: "server1" as const },
  { number: "+44 7911 123456",   country: "United Kingdom", server: "server2" as const },
  { number: "+49 30 1234567",    country: "Germany",        server: "server2" as const },
  { number: "+33 1 23 45 67 89", country: "France",         server: "server2" as const },
];

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all",     label: "All Numbers" },
  { id: "server1", label: "🇺🇸 Server 1 — USA" },
  { id: "server2", label: "🌍 Server 2 — Global" },
];

export function NumbersShowcase() {
  const [active, setActive] = useState<Filter>("all");
  const [copied, setCopied] = useState<string | null>(null);

  const visible = active === "all" ? NUMBERS : NUMBERS.filter((n) => n.server === active);

  function copy(num: string) {
    navigator.clipboard.writeText(num).catch(() => {});
    setCopied(num);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div>
      {/* Filter buttons — mirrors the HTML's .filter-btn */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setActive(f.id)}
            className="px-4 py-2 rounded-[8px] text-sm font-medium transition-all"
            style={
              active === f.id
                ? {
                    background: "var(--primary)",
                    color: "oklch(0.07 0.006 265)",
                    border: "1px solid transparent",
                  }
                : {
                    background: "transparent",
                    color: "var(--muted-foreground)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Number cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {visible.map((n) => (
          <div
            key={n.number}
            className="flex items-center gap-3 p-4 rounded-[14px] transition-transform hover:scale-[1.02]"
            style={{
              background: "oklch(0.10 0.010 265 / 0.85)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "oklch(0.68 0.22 278 / 0.08)" }}
            >
              <Phone className="w-4 h-4" style={{ color: "var(--primary)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-mono font-semibold">{n.number}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                {n.country}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                style={{
                  background: "oklch(0.68 0.22 278 / 0.08)",
                  border: "1px solid oklch(0.68 0.22 278 / 0.20)",
                  color: "var(--primary)",
                }}
              >
                {n.server === "server1" ? "S1" : "S2"}
              </span>
              <button
                onClick={() => copy(n.number)}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: "var(--muted-foreground)" }}
                title="Copy number"
              >
                {copied === n.number ? (
                  <Check className="w-3.5 h-3.5" style={{ color: "var(--primary)" }} />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
