/**
 * Plain-language glossary for real-estate / construction terms used across BLUPRNT.
 * Renderers (web `<GlossaryTerm/>`, future mobile sheet) look up entries by id.
 *
 * Keep definitions short, neutral, and homeowner-friendly — these surface inline
 * in dashboards and document review, not in legal documents.
 */

export type GlossaryEntry = {
  id: string;
  /** Short label users see when no children are provided. */
  term: string;
  /** Common alternate names this entry should match for.  */
  aliases?: readonly string[];
  /** Plain-language one-liner shown first. */
  short: string;
  /** Optional 1–2 sentence elaboration shown in the popover body. */
  long?: string;
};

const GLOSSARY: readonly GlossaryEntry[] = [
  {
    id: "coi",
    term: "COI",
    aliases: ["certificate of insurance"],
    short:
      "Certificate of Insurance — proof a contractor's insurance is active.",
    long: "Lists policy types, limits, and dates. Ask for a current COI before work starts and keep it with the project file.",
  },
  {
    id: "lien-waiver",
    term: "Lien waiver",
    aliases: ["lien release", "release of lien"],
    short:
      "A signed statement that a contractor or supplier has been paid and won't file a lien on your property.",
    long: "Get a partial waiver with each progress payment and a final waiver at closeout to protect title.",
  },
  {
    id: "change-order",
    term: "Change order",
    aliases: ["co change order"],
    short:
      "A written amendment to the original contract that changes scope, price, or schedule.",
    long: "Approve in writing before extra work starts. It should list the new scope, the price impact, and any schedule change.",
  },
  {
    id: "draw-schedule",
    term: "Draw schedule",
    aliases: ["progress payment schedule"],
    short:
      "The plan for when payments are released to the contractor as work hits milestones.",
    long: "Common phases: deposit, rough-in, drywall, finishes, final. Tying payments to inspections protects you.",
  },
  {
    id: "permit",
    term: "Permit",
    short:
      "Local approval to perform regulated work — e.g. structural, electrical, plumbing, mechanical.",
    long: "Required permits should be visible on site. Unpermitted work can complicate insurance, resale, and disclosures.",
  },
  {
    id: "co",
    term: "Certificate of Occupancy",
    aliases: ["cofo", "c of o", "certificate of occupancy"],
    short:
      "Document from the municipality that a building (or remodeled portion) is safe and legal to occupy.",
    long: "Often required after large additions, conversions, or changes of use.",
  },
  {
    id: "contingency",
    term: "Contingency",
    short:
      "A reserve in your budget (usually 10–20%) for surprises uncovered during the project.",
    long: "Older homes and structural work warrant a higher contingency. Track spend against it like a separate line.",
  },
  {
    id: "punch-list",
    term: "Punch list",
    aliases: ["snag list"],
    short:
      "Final list of fixes and touch-ups to complete before the project is signed off.",
    long: "Walk the home with the contractor, document items, and tie the final payment to completion.",
  },
  {
    id: "scope",
    term: "Scope",
    aliases: ["scope of work"],
    short: "The defined work to be performed — what's included and what's not.",
    long: "A clear scope is the foundation of accurate estimates and clean change orders.",
  },
  {
    id: "as-built",
    term: "As-built",
    aliases: ["as built", "as-built drawings"],
    short:
      "Drawings updated to reflect what was actually built, not just the original plan.",
    long: "Helpful for future renovations, refinances, and disclosures at sale.",
  },
  {
    id: "warranty",
    term: "Warranty",
    short:
      "A promise from a manufacturer or contractor to repair or replace under defined conditions and time limits.",
    long: "Track expiration dates and keep proof of purchase or installation. Some warranties require regular maintenance to stay valid.",
  },
  {
    id: "appraisal",
    term: "Appraisal",
    short:
      "An independent professional opinion of a home's market value, often required for financing.",
  },
];

const GLOSSARY_BY_ID = new Map<string, GlossaryEntry>(
  GLOSSARY.map((g) => [g.id, g]),
);

const GLOSSARY_BY_ALIAS = (() => {
  const m = new Map<string, GlossaryEntry>();
  for (const g of GLOSSARY) {
    m.set(g.term.toLowerCase(), g);
    if (g.aliases) {
      for (const a of g.aliases) m.set(a.toLowerCase(), g);
    }
  }
  return m;
})();

export function listGlossaryEntries(): readonly GlossaryEntry[] {
  return GLOSSARY;
}

export function getGlossaryEntry(
  idOrTerm: string | null | undefined,
): GlossaryEntry | null {
  if (!idOrTerm) return null;
  const key = idOrTerm.trim();
  if (!key) return null;
  return (
    GLOSSARY_BY_ID.get(key) ?? GLOSSARY_BY_ALIAS.get(key.toLowerCase()) ?? null
  );
}
