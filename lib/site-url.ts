/** Canonical marketing / share URL (no trailing slash). Defaults to abatidigital.com. */
export function getPublicSiteUrl(): string {
  const a = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (a) return a.replace(/\/$/, "");
  const b = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (b) return b.replace(/\/$/, "");
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/$/, "");
  }
  return "https://abatidigital.com";
}
