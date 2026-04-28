import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/legal-page-shell";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and Conditions for Abati Digital SMS API services.",
};

export default function TermsOfServicePage() {
  return (
    <LegalPageShell title="Abati Digital Service Agreement" lastUpdated="April 2026">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Welcome</h2>
        <p>
          Welcome to Abati Digital. By using our SMS API services, you agree to the following terms:
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Service Description</h2>
        <p>
          Abati Digital provides a specialized SMS Gateway and API for Nigerian businesses to deliver One-Time Passwords
          (OTPs), two-factor authentication (2FA), and transactional alerts.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Permitted Use</h2>
        <p>
          Our services are strictly for transactional and security-based messaging. Users are prohibited from using the
          platform for unsolicited marketing, spam, or fraudulent activities.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Direct Telecom Routes</h2>
        <p>
          We utilize direct telecom routes to ensure high delivery rates and security for end-users.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Account Responsibility</h2>
        <p>
          You are responsible for maintaining the security of your API keys and account credentials.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Compliance</h2>
        <p>
          All users must comply with the Nigerian Communications Commission (NCC) guidelines regarding digital
          communication.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Termination</h2>
        <p>
          Abati Digital reserves the right to suspend accounts found in violation of these terms or suspected of
          fraudulent behavior.
        </p>
        <p className="text-sm">
          Related:{" "}
          <Link href="/privacy" className="text-primary">
            Privacy Policy
          </Link>
        </p>
      </section>
    </LegalPageShell>
  );
}
