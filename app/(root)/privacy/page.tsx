import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/legal-page-shell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for Abati Digital (AbatiDigital.com).",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell title="Privacy Policy" lastUpdated="April 11, 2026">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">1. Information We Collect</h2>
        <p>
          To process orders we collect: Name, email address, WhatsApp number, and payment confirmation details. We{" "}
          <strong>do not</strong> collect or store SMS content, OTPs, or account passwords after delivery.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">2. How We Use Your Information</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>To deliver your order and provide support</li>
          <li>To send order updates via WhatsApp/email</li>
          <li>To comply with legal obligations and prevent fraud</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">3. Data Storage &amp; Security</h2>
        <p>
          Your data is stored securely and accessed only for order fulfillment. Login details sent to you are deleted
          from our systems within 7 days of delivery. We use SSL encryption on our site.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">4. Data Sharing</h2>
        <p>
          We do not sell or rent your data. We only share data with payment processors like Paystack/Flutterwave to
          complete transactions, and only as required by law.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">5. Cookies</h2>
        <p>
          We use basic cookies for site function and analytics. No tracking cookies for advertising without consent.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">6. Your Rights</h2>
        <p>
          You may request access to, correction of, or deletion of your personal data by emailing{" "}
          <a href="mailto:privacy@abatidigital.com">privacy@abatidigital.com</a>. We will respond within 14 days.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">7. Third-Party Links</h2>
        <p>
          Our site may link to WhatsApp or social platforms. We are not responsible for their privacy practices.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">8. Children</h2>
        <p>
          Our services are not directed to individuals under 18. We do not knowingly collect data from minors.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">9. Changes to Policy</h2>
        <p>
          We may update this policy. The &quot;Last Updated&quot; date will change. Continued use constitutes acceptance.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">10. Contact</h2>
        <p>
          Data questions: <a href="mailto:privacy@abatidigital.com">privacy@abatidigital.com</a>
        </p>
        <p>Abati Digital, Lagos, Nigeria</p>
        <p className="text-sm">
          Related:{" "}
          <Link href="/terms" className="text-primary">
            Terms of Service
          </Link>
        </p>
      </section>
    </LegalPageShell>
  );
}
