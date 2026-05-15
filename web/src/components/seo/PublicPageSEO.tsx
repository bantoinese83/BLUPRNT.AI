import type { ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import {
  DEFAULT_OG_IMAGE_PATH,
  META_ROBOTS_INDEX,
  seoAbsoluteUrl,
  seoCanonicalOrigin,
  seoOgImageUrl,
  seoPageTitle,
  SITE_NAME,
} from "@/lib/seo-meta";

export type PublicPageSEOProps = {
  title: string;
  description: string;
  /** Path only, e.g. `/privacy` */
  canonicalPath: string;
  robots?: string;
  ogType?: "website" | "article";
  twitterCard?: "summary" | "summary_large_image";
  keywords?: string;
  /** Extra `<link rel="preload" as="image" />` hrefs (paths or absolute URLs). */
  preloadImages?: string[];
  /** Render FAQ / WebPage JSON-LD via `<script type="application/ld+json">`. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  children?: ReactNode;
};

export function PublicPageSEO({
  title,
  description,
  canonicalPath,
  robots = META_ROBOTS_INDEX,
  ogType = "website",
  twitterCard = "summary_large_image",
  keywords,
  preloadImages,
  jsonLd,
  children,
}: PublicPageSEOProps) {
  const canonicalUrl = seoAbsoluteUrl(canonicalPath);
  const ogImage = seoOgImageUrl(DEFAULT_OG_IMAGE_PATH);
  const documentTitle = seoPageTitle(title);
  const origin = seoCanonicalOrigin();

  const ldScripts = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet htmlAttributes={{ lang: "en" }}>
      <title>{documentTitle}</title>
      <meta name="description" content={description} />
      {keywords ? <meta name="keywords" content={keywords} /> : null}
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonicalUrl} />
      <link rel="alternate" hrefLang="en-US" href={canonicalUrl} />
      <link rel="alternate" hrefLang="x-default" href={origin} />
      {preloadImages?.map((href) => (
        <link
          key={href}
          rel="preload"
          as="image"
          href={href.startsWith("http") ? href : seoAbsoluteUrl(href)}
        />
      ))}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:locale" content="en_US" />
      <meta property="og:title" content={documentTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:type" content="image/png" />
      <meta
        property="og:image:alt"
        content="BLUPRNT — home renovation financial planning for homeowners"
      />
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={documentTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta
        name="twitter:image:alt"
        content="BLUPRNT — home renovation financial planning"
      />
      {ldScripts.map((data, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ))}
      {children}
    </Helmet>
  );
}
