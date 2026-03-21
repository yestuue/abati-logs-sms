import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { SessionProvider } from "next-auth/react";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "Abati Logs & SMS — Virtual Numbers & OTP Platform",
    template: "%s | Abati Logs & SMS",
  },
  description:
    "Get instant virtual phone numbers from USA and global providers. Receive OTPs and SMS messages in real time.",
  keywords: ["virtual number", "OTP", "SMS", "Abati Logs", "Nigeria"],
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0a0f1e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body>
        <SessionProvider>
          {children}
          <Toaster
            position="top-right"
            richColors
            theme="dark"
            toastOptions={{
              style: {
                background: "oklch(0.12 0.012 250)",
                border: "1px solid oklch(0.25 0.025 250 / 0.5)",
                color: "oklch(0.97 0.005 250)",
              },
            }}
          />
        </SessionProvider>
      </body>
    </html>
  );
}
