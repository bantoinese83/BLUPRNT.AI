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
      "BLUPRNT is a financial operating system for homeowners planning or doing renovations. It helps you turn rough ideas and photos into grounded cost ranges, track invoices and quotes against that plan, and keep a clear record you can share with buyers, agents, or lenders.",
  },
  {
    question: "How does home renovation cost estimation work?",
    answer:
      "You share your project type, location (ZIP or area), and optional photos or notes. BLUPRNT uses regional signals and structured scope data to produce an estimated cost range—not a contractor bid, but a realistic starting point for budgeting and conversations with pros.",
  },
  {
    question: "Can I track renovation spending and documents in one place?",
    answer:
      "Yes. You can upload invoices, quotes, and related documents, map them to your budget where it helps, and see spending against your estimate over time—so your renovation stays a trackable financial asset, not a pile of PDFs.",
  },
  {
    question: "Is BLUPRNT free to try?",
    answer:
      "You can start without a credit card: get an estimate and explore core workflows. Paid plans add higher limits and advanced features; pricing is shown on the site before you commit.",
  },
  {
    question: "Who is BLUPRNT for?",
    answer:
      "Homeowners who want clarity on remodel costs, organized records for resale, and a single place to connect estimates, actuals, and improvement history—not generic contractor software built for job sites.",
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
          "Home value management system: grounded cost estimates, project tracking, and a property value record for homeowners.",
        publisher: { "@id": orgId },
        inLanguage: "en-US",
      },
      {
        "@type": "Organization",
        "@id": orgId,
        name: "BLUPRNT",
        alternateName: "BLUPRNT.AI",
        url: siteUrl,
        logo: {
          "@type": "ImageObject",
          url: `${siteUrl}/bluprnt_logo.svg`,
        },
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
          "Every upgrade should pay you back. BLUPRNT helps homeowners estimate costs, track projects, and understand how renovations impact home value.",
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
          description: "Free tier and trial; paid plans available.",
        },
        description:
          "AI home renovation cost estimator and remodel budget tracker. Plan kitchen and bathroom renovations with location-based pricing and photo analysis.",
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
