import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/app-shell";
import { BottomNav } from "@/components/layout/bottom-nav";
import { VerifyBanner } from "@/components/dashboard/verify-banner";
import { FloatingSupport } from "@/components/landing/floating-support";

/** Route group `(dashboard)` shares the same shell as `/dashboard/*` for extra user pages (e.g. `/referrals`). */
export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      isVerified: true,
      email: true,
      walletBalance: true,
      walletCurrency: true,
    },
  });

  const verifyBanner =
    user && !user.isVerified ? <VerifyBanner email={user.email} /> : null;

  return (
    <>
      <AppShell
        variant="user"
        walletBalance={user?.walletBalance ?? 0}
        walletCurrency={(user?.walletCurrency ?? "NGN") as "NGN" | "USD"}
        userName={session.user.name ?? undefined}
        userEmail={session.user.email ?? undefined}
        userRole={session.user.role ?? undefined}
        verifyBanner={verifyBanner}
      >
        {children}
      </AppShell>

      <BottomNav />
      <FloatingSupport />
    </>
  );
}
