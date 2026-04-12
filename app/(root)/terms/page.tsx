import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/legal-page-shell";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for Abati Digital (AbatiDigital.com).",
};

export default function TermsOfServicePage() {
  return (
    <LegalPageShell title="Terms of Service" lastUpdated="April 11, 2026">
      <p className="text-sm italic text-muted-foreground/90">
        Disclaimer: This is a strong template for your niche. Have a Nigerian lawyer review before launch if you
        scale.
      </p>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">1. Agreement to Terms</h2>
        <p>
          By accessing or purchasing from{" "}
          <a href="https://abatidigital.com" rel="noopener noreferrer">
            AbatiDigital.com
          </a>{" "}
          (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;), you agree to be bound by these Terms. If you disagree,
          do not use our services.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">2. Services</h2>
        <p>
          Abati Digital provides access to pre-verified virtual phone numbers and pre-created social media accounts for
          marketing, business testing, and digital communication purposes. We are an independent provider and are not
          affiliated with, endorsed by, or sponsored by Meta, Google, TikTok, Telegram, or any other platform.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">3. User Eligibility</h2>
        <p>
          You must be 18+ to purchase. By ordering, you confirm you are of legal age and will use services in compliance
          with all local laws and platform terms.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">4. Permitted Use</h2>
        <p>
          Services are sold for lawful business, marketing, and communication use only. You agree not to use purchased
          accounts/numbers for spam, fraud, harassment, impersonation, illegal activity, or any action that violates a
          platform&apos;s Terms of Service.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">5. No Affiliation</h2>
        <p>
          We do not create or control third-party platforms. We only provide access to existing accounts/numbers.
          Platform rules may change. We are not responsible for actions taken by Meta, Google, TikTok, or others against
          your account.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">6. Delivery</h2>
        <p>
          Digital products are delivered via email or WhatsApp within 5–60 minutes of confirmed payment. Delivery is
          complete once login details are sent.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">7. Refund &amp; Replacement Policy</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Replacements:</strong> If login details do not work on first attempt, contact us within 24 hours for
            a free replacement.
          </li>
          <li>
            <strong>No Refunds:</strong> All sales are final once valid login details are delivered. No refunds for
            bans, restrictions, or misuse after successful login.
          </li>
          <li>
            <strong>Chargebacks:</strong> Filing a chargeback after successful delivery will result in a permanent ban.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">8. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, Abati Digital shall not be liable for any indirect, incidental, or
          consequential damages, including account bans, loss of profits, or business interruption arising from use of
          our services. Our total liability is limited to the amount paid for the specific order.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">9. Account Security</h2>
        <p>
          You are responsible for changing passwords and securing accounts immediately after delivery. We are not liable
          for losses due to failure to secure your account.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">10. Termination</h2>
        <p>
          We reserve the right to refuse service to anyone for any reason, including suspected fraud or violation of
          these Terms.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">11. Governing Law</h2>
        <p>
          These Terms are governed by the laws of the Federal Republic of Nigeria. Disputes will be handled in the courts
          of Lagos State.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">12. Contact</h2>
        <p>
          Questions:{" "}
          <a href="mailto:hello@abatidigital.com">hello@abatidigital.com</a>
          {" · "}
          WhatsApp:{" "}
          <a href="https://api.whatsapp.com/send?phone=2349049386397" rel="noopener noreferrer">
            +234 904 938 6397
          </a>
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
