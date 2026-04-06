/**
 * Client-side PDF export for the property ledger / seller packet.
 * Generates a printable record of home improvements for buyers and agents.
 */

import { jsPDF } from "jspdf";

type JsPdfInstance = InstanceType<typeof jsPDF>;
import {
  capitalImprovementTotal,
  planVsActualNarrative,
  planVsActualPdfLines,
} from "@/lib/plan-vs-actual";

type ScopeItem = {
  category: string;
  description: string;
  total_cost_min: number | null;
  total_cost_max: number | null;
};

type InvoiceItem = {
  vendor_name: string | null;
  total: number | null;
  created_at: string;
  document_type?: string | null;
};

type ProjectInfo = {
  name: string;
  estimated_min_total: number | null;
  estimated_max_total: number | null;
};

const FONT_SIZE = 10;
const HEADING_SIZE = 14;
const TITLE_SIZE = 18;
const MARGIN = 20;
const LINE_HEIGHT = 6;

function money(n: number | null): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function moneyRange(min: number | null, max: number | null): string {
  if (min != null && max != null) return `${money(min)} – ${money(max)}`;
  if (min != null) return money(min);
  return "—";
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function maintenanceTotal(invoices: InvoiceItem[]): number {
  return invoices
    .filter((i) => {
      const t = (i.document_type ?? "").toLowerCase();
      return t === "warranty" || t === "permit";
    })
    .reduce((s, i) => s + (i.total ?? 0), 0);
}

/** Plan vs documented spend — narrative for agents, buyers, and you. */
function drawPlanVsActualSection(
  doc: JsPdfInstance,
  y: number,
  project: ProjectInfo,
  capitalTotal: number,
  addPageIfNeeded: (needed: number) => void,
): number {
  doc.setTextColor(0, 0, 0);
  addPageIfNeeded(LINE_HEIGHT * 8);
  doc.setFontSize(HEADING_SIZE);
  doc.setFont("helvetica", "bold");
  doc.text("Plan vs documented spend", MARGIN, y);
  y += LINE_HEIGHT * 1.5;

  doc.setFontSize(FONT_SIZE);
  doc.setFont("helvetica", "normal");
  const lines = planVsActualPdfLines(
    project.estimated_min_total,
    project.estimated_max_total,
    capitalTotal,
  );
  for (const line of lines) {
    const parts = doc.splitTextToSize(line, 170);
    for (const frag of parts) {
      addPageIfNeeded(LINE_HEIGHT * 2);
      doc.text(frag, MARGIN + 2, y);
      y += LINE_HEIGHT * 1.25;
    }
  }
  y += LINE_HEIGHT * 0.5;
  return y;
}

export async function generateSellerPacketPDF(
  project: ProjectInfo,
  scopeItems: ScopeItem[],
  invoices: InvoiceItem[],
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN;

  const capitalTotal = capitalImprovementTotal(invoices);
  const maintenance = maintenanceTotal(invoices);

  const addPageIfNeeded = (needed: number) => {
    if (y + needed > doc.internal.pageSize.height - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  };

  // Title
  doc.setFontSize(TITLE_SIZE);
  doc.setFont("helvetica", "bold");
  doc.text("Property Improvement Ledger", MARGIN, y);
  y += LINE_HEIGHT * 2;

  doc.setFontSize(FONT_SIZE);
  doc.setFont("helvetica", "normal");
  doc.text(`Project: ${project.name}`, MARGIN, y);
  y += LINE_HEIGHT;
  doc.text(`Generated: ${formatDate(new Date().toISOString())}`, MARGIN, y);
  y += LINE_HEIGHT * 2;

  // Estimate summary
  doc.setFontSize(HEADING_SIZE);
  doc.setFont("helvetica", "bold");
  doc.text("Estimated Scope", MARGIN, y);
  y += LINE_HEIGHT * 1.5;

  doc.setFontSize(FONT_SIZE);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Total estimate: ${moneyRange(project.estimated_min_total, project.estimated_max_total)}`,
    MARGIN,
    y,
  );
  y += LINE_HEIGHT * 1.5;

  if (scopeItems.length > 0) {
    scopeItems.forEach((s) => {
      addPageIfNeeded(LINE_HEIGHT * 2);
      doc.text(
        `• ${s.category}: ${s.description} — ${moneyRange(s.total_cost_min, s.total_cost_max)}`,
        MARGIN + 2,
        y,
        { maxWidth: 170 },
      );
      y += LINE_HEIGHT * 1.2;
    });
    y += LINE_HEIGHT;
  }

  y = drawPlanVsActualSection(doc, y, project, capitalTotal, addPageIfNeeded);

  addPageIfNeeded(LINE_HEIGHT * 4);

  // Invoices / actual costs
  doc.setFontSize(HEADING_SIZE);
  doc.setFont("helvetica", "bold");
  doc.text("Recorded Costs", MARGIN, y);
  y += LINE_HEIGHT * 1.5;

  doc.setFontSize(FONT_SIZE);
  doc.setFont("helvetica", "normal");

  if (invoices.length === 0) {
    doc.text("No invoices or documents recorded yet.", MARGIN, y);
    y += LINE_HEIGHT * 2;
  } else {
    invoices.forEach((inv) => {
      addPageIfNeeded(LINE_HEIGHT * 2);
      const type = (inv.document_type ?? "invoice").toString();
      const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
      doc.text(
        `${formatDate(inv.created_at)} — ${inv.vendor_name ?? "Vendor"} (${typeLabel}): ${money(inv.total)}`,
        MARGIN + 2,
        y,
        { maxWidth: 170 },
      );
      y += LINE_HEIGHT * 1.2;
    });
    y += LINE_HEIGHT;
  }

  addPageIfNeeded(LINE_HEIGHT * 6);

  // Totals
  doc.setFontSize(HEADING_SIZE);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", MARGIN, y);
  y += LINE_HEIGHT * 1.5;

  doc.setFontSize(FONT_SIZE);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Capital improvements (invoices, quotes): ${money(capitalTotal)}`,
    MARGIN + 2,
    y,
  );
  y += LINE_HEIGHT;
  doc.text(
    `Maintenance (warranties, permits): ${money(maintenance)}`,
    MARGIN + 2,
    y,
  );
  y += LINE_HEIGHT * 1.5;
  doc.setFont("helvetica", "bold");
  doc.text(
    `Total recorded: ${money(capitalTotal + maintenance)}`,
    MARGIN + 2,
    y,
  );

  // Footer
  y = doc.internal.pageSize.height - MARGIN;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(
    "BLUPRNT.AI — Includes regional estimate, plan vs documented spend, and uploaded records. Not a substitute for professional appraisal or tax advice.",
    MARGIN,
    y,
  );

  doc.save(
    `property-ledger-${project.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.pdf`,
  );
}

/**
 * Generate PDF as Blob for upload to storage.
 */
export async function generateSellerPacketBlob(
  project: ProjectInfo,
  scopeItems: ScopeItem[],
  invoices: InvoiceItem[],
): Promise<Blob> {
  const { jsPDF: JsPDF } = await import("jspdf");
  const doc = new JsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN;

  const capitalTotal = capitalImprovementTotal(invoices);
  const maintenance = maintenanceTotal(invoices);

  const addPageIfNeeded = (needed: number) => {
    if (y + needed > doc.internal.pageSize.height - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  };

  doc.setFontSize(TITLE_SIZE);
  doc.setFont("helvetica", "bold");
  doc.text("Property Improvement Ledger", MARGIN, y);
  y += LINE_HEIGHT * 2;

  doc.setFontSize(FONT_SIZE);
  doc.setFont("helvetica", "normal");
  doc.text(`Project: ${project.name}`, MARGIN, y);
  y += LINE_HEIGHT;
  doc.text(`Generated: ${formatDate(new Date().toISOString())}`, MARGIN, y);
  y += LINE_HEIGHT * 2;

  doc.setFontSize(HEADING_SIZE);
  doc.setFont("helvetica", "bold");
  doc.text("Estimated Scope", MARGIN, y);
  y += LINE_HEIGHT * 1.5;

  doc.setFontSize(FONT_SIZE);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Total estimate: ${moneyRange(project.estimated_min_total, project.estimated_max_total)}`,
    MARGIN,
    y,
  );
  y += LINE_HEIGHT * 1.5;

  if (scopeItems.length > 0) {
    scopeItems.forEach((s) => {
      addPageIfNeeded(LINE_HEIGHT * 2);
      doc.text(
        `• ${s.category}: ${s.description} — ${moneyRange(s.total_cost_min, s.total_cost_max)}`,
        MARGIN + 2,
        y,
        { maxWidth: 170 },
      );
      y += LINE_HEIGHT * 1.2;
    });
    y += LINE_HEIGHT;
  }

  y = drawPlanVsActualSection(doc, y, project, capitalTotal, addPageIfNeeded);

  addPageIfNeeded(LINE_HEIGHT * 4);

  doc.setFontSize(HEADING_SIZE);
  doc.setFont("helvetica", "bold");
  doc.text("Recorded Costs", MARGIN, y);
  y += LINE_HEIGHT * 1.5;

  doc.setFontSize(FONT_SIZE);
  doc.setFont("helvetica", "normal");

  if (invoices.length === 0) {
    doc.text("No invoices or documents recorded yet.", MARGIN, y);
    y += LINE_HEIGHT * 2;
  } else {
    invoices.forEach((inv) => {
      addPageIfNeeded(LINE_HEIGHT * 2);
      const type = (inv.document_type ?? "invoice").toString();
      const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
      doc.text(
        `${formatDate(inv.created_at)} — ${inv.vendor_name ?? "Vendor"} (${typeLabel}): ${money(inv.total)}`,
        MARGIN + 2,
        y,
        { maxWidth: 170 },
      );
      y += LINE_HEIGHT * 1.2;
    });
    y += LINE_HEIGHT;
  }

  addPageIfNeeded(LINE_HEIGHT * 6);

  doc.setFontSize(HEADING_SIZE);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", MARGIN, y);
  y += LINE_HEIGHT * 1.5;

  doc.setFontSize(FONT_SIZE);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Capital improvements (invoices, quotes): ${money(capitalTotal)}`,
    MARGIN + 2,
    y,
  );
  y += LINE_HEIGHT;
  doc.text(
    `Maintenance (warranties, permits): ${money(maintenance)}`,
    MARGIN + 2,
    y,
  );
  y += LINE_HEIGHT * 1.5;
  doc.setFont("helvetica", "bold");
  doc.text(
    `Total recorded: ${money(capitalTotal + maintenance)}`,
    MARGIN + 2,
    y,
  );

  y = doc.internal.pageSize.height - MARGIN;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(
    "BLUPRNT.AI — Includes regional estimate, plan vs documented spend, and uploaded records. Not a substitute for professional appraisal or tax advice.",
    MARGIN,
    y,
  );

  return doc.output("blob");
}

/**
 * Generate PDF for Dashboard Project Summary.
 */
export async function generateDashboardSummaryPDF(
  project: ProjectInfo,
  invoices: InvoiceItem[],
  invoiceTotal: number,
) {
  const { jsPDF: JsPDF } = await import("jspdf");
  const doc = new JsPDF();
  const capitalTracked = capitalImprovementTotal(invoices);
  const title = project.name.toUpperCase();
  const date = new Date().toLocaleDateString();

  // Header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("BLUPRNT.AI", 20, 25);
  doc.setFontSize(10);
  doc.text("EXECUTIVE PROJECT SUMMARY", 150, 25);

  // Body
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(18);
  doc.text(title, 20, 55);
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on ${date}`, 20, 62);

  // Stats Section
  doc.setDrawColor(226, 232, 240);
  doc.line(20, 70, 190, 70);

  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text("ESTIMATED RANGE:", 20, 85);
  doc.setFont("helvetica", "normal");
  doc.text(
    moneyRange(project.estimated_min_total, project.estimated_max_total),
    70,
    85,
  );

  doc.setFont("helvetica", "bold");
  doc.text("TOTAL LOGGED (ALL DOCS):", 20, 95);
  doc.setFont("helvetica", "normal");
  doc.text(money(invoiceTotal), 70, 95);

  const snapshot = planVsActualNarrative(
    project.estimated_min_total,
    project.estimated_max_total,
    capitalTracked,
  );
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("PLAN VS DOCUMENTED (INVOICES & QUOTES):", 20, 104);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const snapshotText = `${snapshot.headline} ${snapshot.body}`;
  const snapshotLines = doc.splitTextToSize(snapshotText, 170);
  let yTable = 108;
  snapshotLines.forEach((fragment: string) => {
    doc.text(fragment, 20, yTable);
    yTable += 5;
  });
  yTable += 6;

  // Invoices Table Header
  doc.setFontSize(12);
  doc.setFillColor(248, 250, 252);
  doc.rect(20, yTable, 170, 10, "F");
  doc.setFont("helvetica", "bold");
  doc.text("VENDOR", 25, yTable + 7);
  doc.text("TOTAL", 150, yTable + 7);
  yTable += 14;

  // Invoices Rows
  doc.setFont("helvetica", "normal");
  invoices.slice(0, 15).forEach((inv, i) => {
    const y = yTable + i * 10;
    doc.text(inv.vendor_name || "Unknown", 25, y);
    doc.text(money(inv.total), 150, y);
    doc.setDrawColor(241, 245, 249);
    doc.line(20, y + 3, 190, y + 3);
  });

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    "This report was generated by BLUPRNT.AI. All benchmarks are regional averages.",
    20,
    280,
  );

  doc.save(`${project.name.toLowerCase().replace(/\s+/g, "-")}-summary.pdf`);
}
