export const LANDING_HIGHLIGHT_COLOR = "rgba(99, 102, 241, 0.2)";

export const LANDING_HERO_COPY = {
  badge: "AI Home Renovation Financial Operating System",
  titlePrefix: "Every upgrade should pay you back.",
  titleHighlight: "BLUPRNT makes sure it does.",
  body: "Stop flying blind on your remodel. Get professional AI-driven cost estimates, track every invoice against a hardened property ledger, and build a resale-ready record that lenders and buyers trust.",
  primaryCta: "Build Your Asset",
  secondaryCta: "Create Free Account",
} as const;

export const LANDING_STORY_COPY = {
  heading: "Property Intelligence for the Modern Owner.",
  paragraphs: [
    "We created BLUPRNT because most renovation tools aren't built for you—they're built to sell your contact info to contractors at a premium.",
    "Your home is your largest financial asset. You deserve a professional-grade ledger to track that investment from the first photo scan to the final sale.",
    "BLUPRNT uses Gemini-powered vision to provide 'hardened' cost estimates before you even talk to a contractor. Once the work begins, it acts as your financial control tower, extracting data from quotes and receipts to keep your budget on track.",
    "By maintaining an AI-verified improvement record—including warranties, permits, and a detailed Bill of Materials—you're not just 'renovating'; you're building a verifiable financial passport for your home.",
    "When you're ready to sell or refinance, BLUPRNT provides a clean, professional Seller Packet that proves every dollar of equity you've built. Stop using messy folders and lost emails—use the system built for owners.",
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
    feature: "Renovation AI",
    architect: "Grounded Insights",
    pass: "Included (6mo)",
    hint: "Regional labor & material signals",
  },
  {
    feature: "Smart Receipts",
    architect: "10 scans / mo",
    pass: "Unlimited",
    hint: "OCR extraction & categorization",
  },
  {
    feature: "Active Projects",
    architect: "Up to 2",
    pass: "1",
    hint: "Concurrent tracking",
  },
  {
    feature: "Seller Packet",
    architect: "Included",
    pass: "Included",
    hint: "PDF export for resale",
  },
  {
    feature: "Lender-Ready Data",
    architect: "AI Verified BOM",
    pass: "AI Verified BOM",
    hint: "Granular data for bank appraisals",
  },
  {
    feature: "Record Access",
    architect: "Always",
    pass: "Lifetime",
    hint: "Read-only after pass expiry",
  },
] as const;

export const COMPARISON_FEATURES = [
  {
    name: "AI Photo Analysis",
    bluprnt: true,
    visualizers: true,
    proTools: false,
    static: false,
  },
  {
    name: "Granular BOM Output",
    bluprnt: true,
    visualizers: false,
    proTools: true,
    static: false,
  },
  {
    name: "Regional Labor Index",
    bluprnt: true,
    visualizers: false,
    proTools: true,
    static: false,
  },
  {
    name: "Property Ledger",
    bluprnt: true,
    visualizers: false,
    proTools: false,
    static: true,
  },
  {
    name: "Public View Token",
    bluprnt: true,
    visualizers: false,
    proTools: false,
    static: false,
  },
  {
    name: "Consumer-First UX",
    bluprnt: true,
    visualizers: true,
    proTools: false,
    static: true,
  },
] as const;
