/**
 * Client-side PDF export for the property ledger / seller packet.
 * Generates a printable record of home improvements for buyers and agents.
 */

import { jsPDF } from "jspdf";

type JsPdfInstance = InstanceType<typeof jsPDF>;
import {
  capitalImprovementTotal,
  planVsActualPdfLines,
} from "@/lib/plan-vs-actual";
import type { SellerPacketAppendixItem } from "@/lib/seller-packet-appendix";

export type { SellerPacketAppendixItem } from "@/lib/seller-packet-appendix";

export type SellerPacketExportOptions = {
  /** Optional pages with embedded images / notes for originals (off by default for privacy & size). */
  appendixItems?: SellerPacketAppendixItem[];
};

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

function drawSellerPacketAppendix(
  doc: JsPdfInstance,
  appendixItems: SellerPacketAppendixItem[],
): void {
  if (!appendixItems.length) return;

  doc.addPage();
  let y = MARGIN;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(HEADING_SIZE);
  doc.setFont("helvetica", "bold");
  doc.text("Appendix: Original uploads", MARGIN, y);
  y += LINE_HEIGHT * 1.75;

  doc.setFontSize(FONT_SIZE - 1);
  doc.setFont("helvetica", "normal");
  const intro = doc.splitTextToSize(
    "Optional section. Image receipts appear below. PDFs are not pasted into this file to keep size down—use View original in the app. Sharing this PDF may expose personal or financial details from receipts.",
    170,
  );
  for (const line of intro) {
    doc.text(line, MARGIN, y);
    y += LINE_HEIGHT * 1.1;
  }

  const pageH = doc.internal.pageSize.height;
  const pageW = doc.internal.pageSize.width;

  for (const item of appendixItems) {
    doc.addPage();
    y = MARGIN;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    for (const t of doc.splitTextToSize(item.title, 170)) {
      doc.text(t, MARGIN, y);
      y += LINE_HEIGHT * 1.2;
    }
    y += LINE_HEIGHT * 0.5;

    if (item.kind === "image") {
      try {
        const props = doc.getImageProperties(item.dataUrl);
        const maxW = pageW - 2 * MARGIN;
        const maxH = pageH - y - MARGIN - 10;
        const ratio = props.height / props.width;
        let w = maxW;
        let h = w * ratio;
        if (h > maxH) {
          h = maxH;
          w = h / ratio;
        }
        doc.addImage(item.dataUrl, item.imageFormat, MARGIN, y, w, h);
      } catch {
        doc.setFontSize(FONT_SIZE);
        doc.setFont("helvetica", "normal");
        doc.text(
          "We couldn’t embed this image in the PDF. Open the original in the app.",
          MARGIN,
          y,
          { maxWidth: 170 },
        );
      }
    } else {
      doc.setFontSize(FONT_SIZE);
      doc.setFont("helvetica", "normal");
      for (const noteLine of item.noteLines) {
        for (const p of doc.splitTextToSize(noteLine, 170)) {
          if (y > pageH - MARGIN) {
            doc.addPage();
            y = MARGIN;
          }
          doc.text(p, MARGIN, y);
          y += LINE_HEIGHT * 1.2;
        }
      }
    }
  }
}

export async function generateSellerPacketPDF(
  project: ProjectInfo,
  scopeItems: ScopeItem[],
  invoices: InvoiceItem[],
  options?: SellerPacketExportOptions,
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

  drawSellerPacketAppendix(doc, options?.appendixItems ?? []);

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
  options?: SellerPacketExportOptions,
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

  drawSellerPacketAppendix(doc, options?.appendixItems ?? []);

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
