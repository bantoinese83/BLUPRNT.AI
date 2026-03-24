export const LANDING_HIGHLIGHT_COLOR = "rgba(99, 102, 241, 0.2)";

export const LANDING_HERO_COPY = {
  badge: "AI Home Renovation Cost Estimator",
  titlePrefix: "Every upgrade should pay you back.",
  titleHighlight: "BLUPRNT makes sure it does.",
  body: "BLUPRNT is a professional home renovation planner and budget tracker. Get grounded cost estimates for kitchen and bathroom remodels, track every invoice against your budget, and see how your renovations build long-term home value.",
  primaryCta: "Start Free Estimate",
  secondaryCta: "Create free account",
} as const;

export const LANDING_STORY_COPY = {
  heading: "The Homeowner's Financial Operating System.",
  paragraphs: [
    "We created BLUPRNT because most renovation cost estimators aren't built for you—they're built to sell your leads to contractors.",
    "Renovating your home is your largest financial investment. You deserve a professional tool to track that investment from the first estimate to the final inspection.",
    "BLUPRNT provides location-based renovation cost estimates before you even hire a contractor. Once your project begins, it acts as a smart kitchen and bathroom remodel budget tracker, automatically extracting details from your invoices and receipts.",
    "Keep your entire home improvement history organized in one place—quotes, receipts, warranties, and permits—creating a complete property ledger and professional seller's record.",
    "Track your total investment in real-time and understand its impact on your home's resale value. When you're ready to sell, hand your buyer a clean, verified renovation packet that proves the value of every upgrade.",
    "Stop using messy spreadsheets and lost piles of paperwork. Use the first renovation management system built for the modern homeowner.",
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
    feature: "Record Access",
    architect: "Always",
    pass: "Lifetime",
    hint: "Read-only after pass expiry",
  },
] as const;
