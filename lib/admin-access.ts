const SUPER_ADMIN_EMAILS = new Set([
  "abatiemmanuel24@gmail.com",
  "growthprofesors@gmail.com",
]);

export function normalizeEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  return SUPER_ADMIN_EMAILS.has(normalizeEmail(email));
}
