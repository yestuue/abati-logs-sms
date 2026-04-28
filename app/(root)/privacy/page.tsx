import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/legal-page-shell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy and Data Protection Policy for Abati Digital SMS API services.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell title="Privacy & Data Protection Policy" lastUpdated="April 2026">
      <section className="space-y-3">
        <p>At Abati Digital, we prioritize the security of your business data and your users&apos; privacy.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Data Collection</h2>
        <p>
          We collect minimal data necessary for service delivery, including business contact details and transactional
          logs required for API debugging.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Data Usage</h2>
        <p>
          Transactional data (OTPs and alerts) is used solely for delivery and is not shared with third-party
          advertisers.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Security</h2>
        <p>
          We implement industry-standard encryption and secure server protocols to protect all data transmitted through
          our API.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">User Rights</h2>
        <p>
          You have the right to access, correct, or request the deletion of your business data at any time via our
          support channels.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Cookies</h2>
        <p>
          Our website uses cookies strictly for session management and improved user experience.
        </p>
        <p className="text-sm">
          Related:{" "}
          <Link href="/terms" className="text-primary">
            Terms &amp; Conditions
          </Link>
        </p>
      </section>
    </LegalPageShell>
  );
}
