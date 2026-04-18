/**
 * Highlighter colors for marketing — match web `src/index.css` `--color-accent` (#0d9488)
 * and mobile `Theme.colors.brand` (teal 500/600). Replaces former indigo highlight.
 */
/** Soft wash for highlight/box/circle (teal-600) */
export const LANDING_HIGHLIGHT_COLOR = "rgba(13, 148, 136, 0.22)";
/** Underlines & strong emphasis (teal-500, same as mobile `brand.light`) */
export const LANDING_HIGHLIGHT_UNDERLINE = "#14b8a6";
/** Alternate emphasis blocks — mint teal (teal-400 tint) */
export const LANDING_HIGHLIGHT_SOFT = "rgba(45, 212, 191, 0.32)";

export const LANDING_HERO_COPY = {
  badge: "Renovation money—finally in one place",
  titlePrefix: "Run your remodel like a pro from budget to resale.",
  /** Hero subline: underline + highlight combo (see HeroSection). */
  titleHighlightLead: "Start your Bluprnt and get accurate local estimates,",
  titleHighlightEmphasis: "track your project in real time,",
  titleHighlightTail: "and prove your investment at resale.",
  body: "Before you hire, get a realistic range for your zip code. While work is underway, snap invoices and quotes so “what we planned” and “what we paid” stay clear—then wrap it into one neat PDF when you list or refinance.",
  primaryCta: "Start planning free",
  secondaryCta: "Create free account",
} as const;

/** Trust & distribution — short pills below the hero */
export const LANDING_TRUST_PILLS = [
  { label: "For homeowners—not contractor ads" },
  { label: "Export your file anytime" },
  { label: "Planned budget vs. real spending" },
] as const;

export const LANDING_HOW_INTRO =
  "Local price range, photos of receipts, one clear story for your agent or buyer.";

export const LANDING_STORY_COPY = {
  heading: "You own the house. Own the paperwork too.",
  paragraphs: [
    "We built BLUPRNT because most “renovation apps” want to sell your phone number—not help you sleep at night.",
    "Your home is probably your biggest investment. You deserve a simple running total: what you planned, what you paid, and proof in the drawer.",
    "Snap a room photo for a starting budget in your area—not a bid from a pro, but a sane number for the conversation. When trucks roll up, photograph invoices and quotes so the math doesn’t live in your head.",
    "Keep warranties, permits, and your materials list next to the real costs. When someone asks “what did you do here?” you have an answer that isn’t a shoebox.",
    "Selling or refinancing? One export pulls your story together—less digging through email, more time for everything else.",
  ],
} as const;

export interface PricingRow {
  feature: string;
  architect: string;
  pass: string;
  hint: string;
}

export const PLAN_COMPARISON_ROWS: readonly PricingRow[] = [
  {
    feature: "AI renovation help",
    architect: "Full access",
    pass: "6 months included",
    hint: "Ideas tuned to your area—not a contractor quote",
  },
  {
    feature: "Invoice & receipt reads",
    architect: "10 invoiced docs / mo (account total)",
    pass: "Unlimited for this project (during pass)",
    hint: "Invoices only count toward limits—not quotes or warranties. Architect: one monthly quota shared across all projects.",
  },
  {
    feature: "Jobs at once",
    architect: "Up to 2",
    pass: "1",
    hint: "How many remodels you can track side by side",
  },
  {
    feature: "Listing-ready PDF",
    architect: "Included",
    pass: "Included",
    hint: "One tidy file for agents or buyers",
  },
  {
    feature: "Materials list",
    architect: "Tied to your receipts",
    pass: "Tied to your receipts",
    hint: "What you bought, next to each line item",
  },
  {
    feature: "Open your records later",
    architect: "Anytime",
    pass: "View-only after pass",
    hint: "Pass: full editing for 6 mo, then read-only while BLUPRNT is available",
  },
] as const;

export const COMPARISON_FEATURES = [
  {
    name: "Photo → rough budget",
    bluprnt: true,
    visualizers: true,
    proTools: false,
    static: false,
  },
  {
    name: "Itemized materials list",
    bluprnt: true,
    visualizers: false,
    proTools: true,
    static: false,
  },
  {
    name: "Local labor cost signals",
    bluprnt: true,
    visualizers: false,
    proTools: true,
    static: false,
  },
  {
    name: "Home renovation file (ledger)",
    bluprnt: true,
    visualizers: false,
    proTools: false,
    static: true,
  },
  {
    name: "Share link (read-only)",
    bluprnt: true,
    visualizers: false,
    proTools: false,
    static: false,
  },
  {
    name: "Built for homeowners",
    bluprnt: true,
    visualizers: true,
    proTools: false,
    static: true,
  },
] as const;
