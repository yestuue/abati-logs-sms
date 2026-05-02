import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import { isPrivilegedAdminEmail, normalizeEmail } from "@/lib/admin-access";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  const userEmail = normalizeEmail(session?.user?.email);
  const isPrivileged = 
    userEmail === "growthprofesors@gmail.com" || 
    userEmail === "abatiemmanuel24@gmail.com" || 
    isPrivilegedAdminEmail(userEmail);

  if (session?.user?.role !== "ADMIN" && !isPrivileged) {
    console.warn(`Admin access denied in layout for ${userEmail}`);
    redirect("/dashboard");
  }

  return (
    <AppShell
      variant="admin"
      userName={session.user.name ?? undefined}
      userEmail={session.user.email ?? undefined}
      userRole={session.user.role ?? undefined}
    >
      <div className="min-h-[calc(100vh-7rem)] rounded-2xl border border-indigo-500/20 bg-slate-950/40 p-4 md:p-5">
        {children}
      </div>
    </AppShell>
  );
}
