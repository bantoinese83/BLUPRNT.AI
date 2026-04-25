import sanitizeHtml from "npm:sanitize-html@2.13.1";

/**
 * Strips scripts, event handlers, and other XSS vectors from user-supplied HTML
 * before sending through a transactional email API.
 */
export function sanitizeUserEmailHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      "img",
      "h1",
      "h2",
      "h3",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
    ],
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "width", "height"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowVulnerableTags: false,
  });
}
