/**
 * Public site origin for canonical URLs, Open Graph, and JSON-LD (no trailing slash).
 * Set `VITE_SITE_URL` in production so prerender and crawlers get a stable absolute URL.
 */
export function getPublicSiteUrl(): string {
  const env = import.meta.env.VITE_SITE_URL?.replace(/\/$/, "");
  if (env) return env;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

/** FAQ entries: visible on the landing page and mirrored in FAQPage schema.org markup. */
export const LANDING_FAQ = [
  {
    question: "What is BLUPRNT?",
    answer:
      "BLUPRNT is an intelligent partner for homeowners. It turns photos into local cost estimates, helps you log invoices against that plan, and automatically builds a contractor directory and home manual for future resale.",
  },
  {
    question: "How accurate are the cost estimates?",
    answer:
      "Our AI estimates are anchored in real-world data points specifically for your area—including regional labor rates and current material costs from sources like RSMeans and HomeAdvisor. We cite these sources directly so you can trust the grounding behind the numbers.",
  },
  {
    question: "Can I upload multiple receipts and quotes at once?",
    answer:
      "Yes. BLUPRNT features a batch processing engine that lets you select and upload dozens of invoices, quotes, or warranties simultaneously. Our AI reads them in the background, extracting totals and mapping them to your project scope automatically.",
  },
  {
    question: "How does the Reconciliation Engine work?",
    answer:
      "When you upload an invoice, BLUPRNT automatically maps each line item to your planned budget. You’ll see real-time status badges (Matched, Under, or Over) that show exactly where your money is going versus where you planned it to go.",
  },
  {
    question: "Does BLUPRNT track my contractors and warranties?",
    answer:
      "Every time you upload an invoice, BLUPRNT identifies the contractor and adds them to your 'Home Team' directory. It also tracks warranty expiry dates from your receipts and provides a countdown on your dashboard so you never miss a coverage window.",
  },
  {
    question: "Is BLUPRNT free to try?",
    answer:
      "You can sign up and get an estimate without a credit card. The free tier includes core workflows with up to three invoice uploads per project. Architect and Project Pass plans add higher limits, automated pro directories, and interactive comparison tools.",
  },
  {
    question: "How does the 'Before & After' slider work?",
    answer:
      "Snap a photo at the start of your project and again as you make progress. BLUPRNT creates an interactive 'Transformation Slider' that lets you visualize your home's evolution—a powerful tool for documenting improvements for potential buyers.",
  },
] as const;

export function buildLandingJsonLd(siteUrl: string) {
  const orgId = `${siteUrl}/#organization`;
  const websiteId = `${siteUrl}/#website`;

  const faqEntities = LANDING_FAQ.map((item) => ({
    "@type": "Question" as const,
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer" as const,
      text: item.answer,
    },
  }));

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: siteUrl,
        name: "BLUPRNT",
        description:
          "Renovation cost estimates, invoice tracking, planned vs. actual spending, and resale-ready home files for US homeowners.",
        publisher: { "@id": orgId },
        inLanguage: "en-US",
      },
      {
        "@type": "Organization",
        "@id": orgId,
        name: "BLUPRNT",
        alternateName: "BLUPRNT.AI",
        url: siteUrl,
        description:
          "Homeowner-first renovation app: local estimates, planned vs. documented spend, and seller-ready exports.",
        logo: {
          "@type": "ImageObject",
          url: `${siteUrl}/bluprnt_logo.png`,
        },
        image: `${siteUrl}/og-image.png`,
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${siteUrl}/#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: siteUrl,
          },
        ],
      },
      {
        "@type": "WebPage",
        "@id": `${siteUrl}/#webpage`,
        url: siteUrl,
        name: "BLUPRNT — Home value management system for homeowners",
        isPartOf: { "@id": websiteId },
        breadcrumb: { "@id": `${siteUrl}/#breadcrumb` },
        speakable: {
          "@type": "SpeakableSpecification",
          xpath: [
            "/html/head/title",
            "/html/head/meta[@name='description']/@content",
          ],
        },
        about: {
          "@type": "Thing",
          name: "Home renovation cost estimation, budgeting, and resale documentation",
        },
        description:
          "Grounded remodel cost ranges, plan vs documented spend, and a clear improvement history for buyers and agents.",
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${siteUrl}/#software`,
        name: "BLUPRNT",
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web",
        browserRequirements: "Requires JavaScript. Modern evergreen browser.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          description:
            "Free tier with per-project invoice limits; paid subscription and passes available.",
        },
        description:
          "AI renovation cost estimator, remodel budget tracker, and seller packet PDFs. Compare estimates to invoices and quotes with regional pricing.",
        provider: { "@id": orgId },
      },
      {
        "@type": "Service",
        "@id": `${siteUrl}/#estimator-service`,
        name: "AI Renovation Cost Estimator",
        provider: { "@id": orgId },
        description:
          "Get grounded cost ranges for home renovations using regional labor and material data combined with AI photo analysis.",
        serviceType: "Home Improvement Planning",
        areaServed: "United States",
      },
      {
        "@type": "Service",
        "@id": `${siteUrl}/#budget-tracker-service`,
        name: "Remodel Budget Tracker",
        provider: { "@id": orgId },
        description:
          "Track renovation spending against your initial estimate by scanning and organizing project invoices and receipts.",
        serviceType: "Financial Project Management",
        areaServed: "United States",
      },
      {
        "@type": "FAQPage",
        "@id": `${siteUrl}/#faq`,
        mainEntity: faqEntities,
      },
    ],
  };
}
