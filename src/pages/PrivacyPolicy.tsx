import {
  LegalPageShell,
  LegalParagraph,
  LegalSectionTitle,
} from "@/components/legal/LegalPageShell";

export default function PrivacyPolicy() {
  return (
    <LegalPageShell
      title="Privacy Policy"
      metaDescription="Learn how BLUPRNT protects your data and manages your personal and project information."
    >
      <section>
        <LegalSectionTitle>1. Information we collect</LegalSectionTitle>
        <LegalParagraph>
          We collect information you provide directly to us when you create an account, use our tools,
          or upload construction-related documents. This includes your name, email address, and any
          project-related data you choose to share with BLUPRNT.
        </LegalParagraph>
      </section>

      <section>
        <LegalSectionTitle>2. How we use information</LegalSectionTitle>
        <LegalParagraph>
          We use the information we collect to operate, maintain, and provide the features of
          BLUPRNT, including project estimation, document handling, and related services. We also use
          your data to communicate with you about updates and support.
        </LegalParagraph>
      </section>

      <section>
        <LegalSectionTitle>3. Data security</LegalSectionTitle>
        <LegalParagraph>
          We implement industry-standard security measures to protect your personal and project
          information. Data is stored using providers such as Supabase and encrypted in transit. No
          method of transmission over the internet is completely secure, and we cannot guarantee
          absolute security.
        </LegalParagraph>
      </section>

      <section>
        <LegalSectionTitle>4. Sharing of information</LegalSectionTitle>
        <LegalParagraph>
          We do not sell your personal information. We may share data with third-party service
          providers (such as Stripe for payments) strictly as needed to provide our services to you.
        </LegalParagraph>
      </section>

      <section>
        <LegalSectionTitle>5. Your choices</LegalSectionTitle>
        <LegalParagraph>
          You can access, update, or delete your account information through your dashboard settings
          where available. If you have questions about your data, contact us at{" "}
          <a
            href="mailto:privacy@bluprntai.com"
            className="font-semibold text-indigo-600 underline decoration-indigo-200 underline-offset-2 hover:text-indigo-700"
          >
            privacy@bluprntai.com
          </a>
          .
        </LegalParagraph>
      </section>
    </LegalPageShell>
  );
}
