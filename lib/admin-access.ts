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
