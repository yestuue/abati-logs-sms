import type { Metadata, Viewport } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/theme-provider";
import { PwaRegister } from "@/components/pwa-register";

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  weight: ["300", "400", "500", "600"],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-heading",
  weight: ["600", "700"],
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
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Abati SMS",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)",  color: "#09090d" },
    { media: "(prefers-color-scheme: light)", color: "#00E5A0" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${spaceGrotesk.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Anti-FOUC: read saved theme BEFORE page renders to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('abati-theme')||'dark';document.documentElement.setAttribute('data-theme',t);})()`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <SessionProvider>
            {children}
            <Toaster
              position="top-right"
              richColors
              theme="system"
              toastOptions={{
                style: {
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                },
              }}
            />
          </SessionProvider>
        </ThemeProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
