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
    default: "Abati Digital | B2B SMS & Digital Infrastructure",
    template: "%s | Abati Digital",
  },
  description:
    "Abati Digital: The most reliable SMS API for Nigerian businesses. Send secure OTPs, transactional alerts, and 2FA via direct telecom routes.",
  keywords: ["digital transformation", "process automation", "corporate infrastructure", "Abati Digital", "global business"],
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Abati Digital | B2B SMS & Digital Infrastructure",
    description:
      "Abati Digital: The most reliable SMS API for Nigerian businesses. Send secure OTPs, transactional alerts, and 2FA via direct telecom routes.",
    url: "https://abatidigital.com",
    siteName: "Abati Digital",
    images: [{ url: "/logo.png", width: 1200, height: 630, alt: "Abati Digital" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Abati Digital | B2B SMS & Digital Infrastructure",
    description:
      "Abati Digital: The most reliable SMS API for Nigerian businesses. Send secure OTPs, transactional alerts, and 2FA via direct telecom routes.",
    images: ["/logo.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Abati Digital",
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
