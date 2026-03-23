import {
  LegalList,
  LegalListItem,
  LegalPageShell,
  LegalParagraph,
  LegalSectionTitle,
} from "@/components/legal/LegalPageShell";

export default function TermsOfService() {
  return (
    <LegalPageShell
      title="Terms of Service"
      metaDescription="Read the terms and conditions for using BLUPRNT, the home renovation financial OS."
      canonicalPath="/terms"
    >
      <section>
        <LegalSectionTitle>1. Agreement to terms</LegalSectionTitle>
        <LegalParagraph>
          By accessing or using BLUPRNT, you agree to be bound by these Terms of Service. If you do
          not agree to all of these terms, do not use our services.
        </LegalParagraph>
      </section>

      <section>
        <LegalSectionTitle>2. Description of service</LegalSectionTitle>
        <LegalParagraph>
          BLUPRNT provides a platform for construction document handling, project estimation, and
          related financial tracking for homeowners. We reserve the right to modify or discontinue
          any part of our service at any time.
        </LegalParagraph>
      </section>

      <section>
        <LegalSectionTitle>3. User accounts</LegalSectionTitle>
        <LegalParagraph>
          You are responsible for maintaining the security of your account and password. BLUPRNT
          cannot and will not be liable for any loss or damage from your failure to comply with this
          security obligation.
        </LegalParagraph>
      </section>

      <section>
        <LegalSectionTitle>4. Payments and subscriptions</LegalSectionTitle>
        <LegalParagraph>
          Payments are processed securely through Stripe. Subscriptions renew automatically unless
          cancelled. One-time purchases (Project Passes) are non-refundable once the associated
          analysis or access has been provided as described at purchase.
        </LegalParagraph>
      </section>

      <section>
        <LegalSectionTitle>5. Intellectual property</LegalSectionTitle>
        <LegalParagraph>
          The software and interface of BLUPRNT are the property of our company or our licensors. You
          retain ownership of the documents you upload.
        </LegalParagraph>
      </section>

      <section>
        <LegalSectionTitle>6. Limitation of liability</LegalSectionTitle>
        <LegalParagraph>
          BLUPRNT provides estimates and summaries for informational purposes. Construction costs and
          resale values are subject to market conditions and local variations. We are not responsible
          for architectural or financial decisions made based on product output.
        </LegalParagraph>
      </section>

      <section>
        <LegalSectionTitle>7. Data rights (GDPR &amp; CCPA)</LegalSectionTitle>
        <LegalParagraph>
          Under various global privacy regulations, including GDPR and CCPA, users have specific
          rights regarding their personal data. BLUPRNT provides tools in account settings to:
        </LegalParagraph>
        <LegalList>
          <LegalListItem>Access and export your project and financial data.</LegalListItem>
          <LegalListItem>Correct inaccuracies in your profile information.</LegalListItem>
          <LegalListItem>Request deletion of your account and associated document data.</LegalListItem>
          <LegalListItem>Opt out of specific data processing activities where applicable.</LegalListItem>
        </LegalList>
      </section>
    </LegalPageShell>
  );
}
