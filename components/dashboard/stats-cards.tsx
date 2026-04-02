"use client";
import { motion } from "framer-motion";
import { Wallet, MessageSquare, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface StatsCardsProps {
  walletBalance: number;
  walletCurrency: "NGN" | "USD";
  activeNumbers: number;
  smsReceived: number;
  totalTransactions: number;
  totalSpent?: number;
}

export function StatsCards({
  walletBalance,
  walletCurrency,
  smsReceived,
  totalSpent = 0,
}: StatsCardsProps) {
  const cards = [
    {
      label: "Wallet Balance",
      value: formatCurrency(walletBalance, walletCurrency),
      icon: Wallet,
      gradient: "linear-gradient(135deg, oklch(0.68 0.22 278 / 0.18), oklch(0.55 0.24 278 / 0.10))",
      border: "oklch(0.68 0.22 278 / 0.30)",
      iconBg: "oklch(0.68 0.22 278 / 0.18)",
      iconColor: "oklch(0.78 0.18 278)",
      href: "/dashboard/wallet",
    },
    {
      label: "Messages Received",
      value: smsReceived.toLocaleString(),
      icon: MessageSquare,
      gradient: "linear-gradient(135deg, oklch(0.55 0.20 200 / 0.14), oklch(0.45 0.18 200 / 0.08))",
      border: "oklch(0.55 0.20 200 / 0.28)",
      iconBg: "oklch(0.55 0.20 200 / 0.16)",
      iconColor: "oklch(0.72 0.18 200)",
      href: "/dashboard/sms",
    },
    {
      label: "Total Spent",
      value: formatCurrency(totalSpent, walletCurrency),
      icon: TrendingDown,
      gradient: "linear-gradient(135deg, oklch(0.60 0.20 340 / 0.14), oklch(0.50 0.18 340 / 0.08))",
      border: "oklch(0.60 0.20 340 / 0.28)",
      iconBg: "oklch(0.60 0.20 340 / 0.16)",
      iconColor: "oklch(0.75 0.18 340)",
      href: "/dashboard/transactions",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <motion.a
            key={card.label}
            href={card.href}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.99 }}
          >
            <Card
              className="relative overflow-hidden cursor-pointer transition-all duration-200"
              style={{
                background: card.gradient,
                border: `1px solid ${card.border}`,
              }}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {card.label}
                    </p>
                    <p
                      className="text-2xl font-extrabold leading-none"
                      style={{ fontFamily: "var(--font-heading)", color: "var(--foreground)" }}
                    >
                      {card.value}
                    </p>
                  </div>
                  <div
                    className="p-2.5 rounded-xl flex-shrink-0"
                    style={{ background: card.iconBg }}
                  >
                    <Icon className="w-5 h-5" style={{ color: card.iconColor }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.a>
        );
      })}
    </div>
  );
}
