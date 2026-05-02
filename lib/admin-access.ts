export function normalizeEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

const PRIVILEGED_ADMIN_EMAILS = new Set([
  "abatiemmanuel24@gmail.com",
  "growthprofesors@gmail.com",
]);

export function isPrivilegedAdminEmail(email: string | null | undefined): boolean {
  return PRIVILEGED_ADMIN_EMAILS.has(normalizeEmail(email));
}

/**
 * Robust check for admin privileges.
 * Matches if role is 'ADMIN' OR if the email is in the privileged list.
 */
export function isAdmin(session: any): boolean {
  try {
    if (!session?.user) return false;
    const role = session.user.role;
    const email = session.user.email;
    return role === "ADMIN" || isPrivilegedAdminEmail(email);
  } catch (err) {
    console.error("isAdmin check failed:", err);
    return false;
  }
}
