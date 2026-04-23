import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      isBanned?: boolean;
      walletBalance: number;
      walletCurrency: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    isBanned?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    isBanned?: boolean;
    walletBalance?: number;
    walletCurrency?: string;
  }
}
