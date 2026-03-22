import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { VerifyBanner } from "@/components/dashboard/verify-banner";
import { FloatingSupport } from "@/components/landing/floating-support";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isVerified: true, email: true },
  });

  return (
    <div className="light-theme min-h-screen" style={{ background: "var(--background)" }}>
      <Header variant="user" />

      {/* Yellow verify banner — only shown when isVerified is false */}
      {user && !user.isVerified && (
        <div className="lg:pl-[240px]">
          <VerifyBanner email={user.email} />
        </div>
      )}

      {/* Main content — bottom padding on mobile for the bottom nav */}
      <main className="lg:pl-[240px] pt-14 pb-20 lg:pb-6">
        <div className="p-4 md:p-6 max-w-7xl mx-auto">{children}</div>
      </main>

      {/* Mobile bottom tab bar */}
      <BottomNav />

      {/* Floating WhatsApp support */}
      <FloatingSupport />
    </div>
  );
}
