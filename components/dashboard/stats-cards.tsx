"use client";
import { motion } from "framer-motion";
import { Wallet, Phone, MessageSquare, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface StatsCardsProps {
  walletBalance: number;
  walletCurrency: "NGN" | "USD";
  activeNumbers: number;
  smsReceived: number;
  totalTransactions: number;
}

export function StatsCards({
  walletBalance,
  walletCurrency,
  activeNumbers,
  smsReceived,
  totalTransactions,
}: StatsCardsProps) {
  const cards = [
    {
      label: "Wallet Balance",
      value: formatCurrency(walletBalance, walletCurrency),
      icon: Wallet,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Active Numbers",
      value: activeNumbers.toString(),
      icon: Phone,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "SMS Received",
      value: smsReceived.toString(),
      icon: MessageSquare,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      label: "Transactions",
      value: totalTransactions.toString(),
      icon: CreditCard,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="hover:scale-[1.02] transition-transform duration-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">
                      {card.label}
                    </p>
                    <p className="text-xl font-bold text-foreground mt-1 leading-none">
                      {card.value}
                    </p>
                  </div>
                  <div className={`p-2 rounded-xl ${card.bg}`}>
                    <Icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
