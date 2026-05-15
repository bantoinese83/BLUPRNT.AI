import { Helmet } from "react-helmet-async";
import { META_ROBOTS_NOINDEX, seoPageTitle } from "@/lib/seo-meta";

export type NoIndexPageSEOProps = {
  title: string;
  description?: string;
  robots?: string;
};

/** Utility, auth, and error routes — no canonical or social tags. */
export function NoIndexPageSEO({
  title,
  description,
  robots = META_ROBOTS_NOINDEX,
}: NoIndexPageSEOProps) {
  const documentTitle = seoPageTitle(title);

  return (
    <Helmet htmlAttributes={{ lang: "en" }}>
      <title>{documentTitle}</title>
      {description ? <meta name="description" content={description} /> : null}
      <meta name="robots" content={robots} />
    </Helmet>
  );
}
