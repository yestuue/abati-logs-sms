"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, ShoppingCart, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ServiceCardProps {
  serviceName: string;
  category?: string;
  /** Already-calculated final price (run calculatePrice() server-side) */
  price: number;
  currency?: "NGN" | "USD";
  /** Called when the user clicks "Select Service" after revealing the price */
  onSelect: (serviceName: string, price: number) => void;
}

export function ServiceCard({
  serviceName,
  category,
  price,
  currency = "NGN",
  onSelect,
}: ServiceCardProps) {
  const [revealed, setRevealed] = useState(false);

  const formattedPrice =
    currency === "NGN"
      ? `₦${price.toLocaleString()}`
      : `$${price.toFixed(2)}`;

  return (
    <div
      className="relative flex flex-col gap-3 rounded-2xl p-4 transition-all duration-200"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-sm text-foreground">{serviceName}</p>
          {category && (
            <Badge variant="secondary" className="mt-1 text-[10px]">
              {category}
            </Badge>
          )}
        </div>
        <Tag className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
      </div>

      {/* Price reveal area */}
      <div
        className="rounded-xl px-4 py-3 text-center"
        style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
      >
        <AnimatePresence mode="wait">
          {revealed ? (
            <motion.p
              key="price"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="text-xl font-bold"
              style={{ color: "var(--primary)" }}
            >
              {formattedPrice}
            </motion.p>
          ) : (
            <motion.button
              key="reveal"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              onClick={() => setRevealed(true)}
              className="flex items-center gap-1.5 mx-auto text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              Click to see price
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Action */}
      <Button
        size="sm"
        variant={revealed ? "brand" : "outline"}
        className="w-full"
        disabled={!revealed}
        onClick={() => onSelect(serviceName, price)}
      >
        <ShoppingCart className="w-3.5 h-3.5" />
        {revealed ? "Select Service" : "Reveal Price First"}
      </Button>
    </div>
  );
}
