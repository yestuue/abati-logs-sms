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
    default: "LarryDigitals — Virtual Numbers, Social Logs & OTP Platform",
    template: "%s | LarryDigitals",
  },
  description:
    "Get instant virtual phone numbers from USA and 50+ countries. Buy premium social accounts. Receive OTPs in real time.",
  keywords: ["virtual number", "OTP", "SMS", "LarryDigitals", "Nigeria", "social accounts"],
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "LarryDigitals — Virtual Numbers & Social Logs Platform",
    description:
      "Get instant virtual phone numbers from USA and 50+ countries. Buy premium social accounts. Receive OTPs in real time.",
    url: "https://larrydigitals.com",
    siteName: "LarryDigitals",
    images: [{ url: "/logo.png", width: 1200, height: 630, alt: "LarryDigitals" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LarryDigitals — Virtual Numbers & Social Logs Platform",
    description:
      "Get instant virtual phone numbers from USA and 50+ countries. Buy premium social accounts.",
    images: ["/logo.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LarryDigitals",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)",  color: "#09090d" },
    { media: "(prefers-color-scheme: light)", color: "#7C3AED" },
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
