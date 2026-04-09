import type { Role, Currency, ServerType, NumberStatus, TransactionStatus, TransactionType } from "@prisma/client";
import type { PurchaseCarrierPreference } from "@/lib/number-purchase-price";

export type { Role, Currency, ServerType, NumberStatus, TransactionStatus, TransactionType };
export type { PurchaseCarrierPreference };

export interface NumberPurchaseInitializeBody {
  type: "NUMBER_PURCHASE";
  amount: number;
  numberId: string;
  carrier?: PurchaseCarrierPreference;
  /** Comma-separated US area codes (digits and commas); premium if any full 3-digit segment exists. */
  areaCodes?: string;
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  walletBalance: number;
  walletCurrency: Currency;
  isVerified: boolean;
  createdAt: Date;
}

export interface SafeNumber {
  id: string;
  number: string;
  country: string;
  countryCode: string;
  dialCode: string;
  server: ServerType;
  status: NumberStatus;
  userId: string | null;
  expiresAt: Date | null;
  assignedAt: Date | null;
  priceNGN: number;
  priceUSD: number;
}

export interface SafeSMS {
  id: string;
  userId: string;
  numberId: string;
  from: string;
  to: string;
  body: string;
  read: boolean;
  createdAt: Date;
}

export interface SafeTransaction {
  id: string;
  userId: string;
  amount: number;
  currency: Currency;
  reference: string;
  status: TransactionStatus;
  type: TransactionType;
  server: ServerType | null;
  createdAt: Date;
}

// Extend NextAuth session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      walletBalance: number;
      walletCurrency: string;
    };
  }
}
