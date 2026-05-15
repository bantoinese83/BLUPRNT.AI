import { seoAbsoluteUrl, seoCanonicalOrigin, SITE_NAME } from "@/lib/seo-meta";

export type BreadcrumbItem = {
  name: string;
  path: string;
};

export function buildBreadcrumbListJsonLd(items: BreadcrumbItem[]) {
  const origin = seoCanonicalOrigin();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: seoAbsoluteUrl(item.path),
    })),
    ...(items.length === 1 ? {} : { "@id": `${origin}/#breadcrumb` }),
  };
}

export function buildWebPageJsonLd(options: {
  path: string;
  name: string;
  description: string;
  breadcrumbs?: BreadcrumbItem[];
}) {
  const url = seoAbsoluteUrl(options.path);
  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: options.name,
      description: options.description,
      isPartOf: {
        "@type": "WebSite",
        name: SITE_NAME,
        url: seoCanonicalOrigin(),
      },
      inLanguage: "en-US",
    },
  ];

  if (options.breadcrumbs?.length) {
    graph.push(buildBreadcrumbListJsonLd(options.breadcrumbs));
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

export function buildFaqPageJsonLd(
  faqs: ReadonlyArray<{ question: string; answer: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function buildContactPageJsonLd(options: {
  path: string;
  name: string;
  description: string;
  email: string;
}) {
  const url = seoAbsoluteUrl(options.path);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ContactPage",
        "@id": `${url}#contactpage`,
        url,
        name: options.name,
        description: options.description,
        inLanguage: "en-US",
      },
      {
        "@type": "Organization",
        name: SITE_NAME,
        url: seoCanonicalOrigin(),
        email: options.email,
      },
    ],
  };
}
