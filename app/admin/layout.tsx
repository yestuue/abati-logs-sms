import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  return (
    <AppShell
      variant="admin"
      userName={session.user.name ?? undefined}
      userEmail={session.user.email ?? undefined}
      userRole={session.user.role ?? undefined}
    >
      {children}
    </AppShell>
  );
}
