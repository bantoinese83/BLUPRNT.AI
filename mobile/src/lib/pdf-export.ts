import { InteractionManager } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { money, formatShortUsDate } from "@shared/lib/formatters";
import { supabase } from "@/lib/supabase";
import {
  capitalImprovementTotal,
  maintenanceDocumentTotal,
  planVsActualPdfLines,
} from "@shared/lib/plan-vs-actual";
import { buildSellerPacketAppendixHtml } from "@/lib/seller-packet-appendix";
import type { InvoiceRow } from "@shared/types/database";

type ScopeItem = {
  category: string;
  description: string;
  total_cost_min: number | null;
  total_cost_max: number | null;
};

type InvoiceItem = {
  id: string;
  vendor_name: string | null;
  total: number | null;
  created_at: string;
  document_type?: string | null;
  document_id?: string | null;
};

type ProjectInfo = {
  id: string;
  property_id?: string;
  name: string;
  estimated_min_total: number | null;
  estimated_max_total: number | null;
};

export type SellerPacketPdfOptions = {
  /** Larger PDF; may embed receipt images. PDF uploads stay as notes only. */
  includeAppendix?: boolean;
};

export async function generateSellerPacketPDF(
  project: ProjectInfo,
  scopeItems: ScopeItem[],
  invoices: InvoiceItem[],
  options?: SellerPacketPdfOptions,
) {
  const capitalTotal = capitalImprovementTotal(invoices);
  const maintenanceTotal = maintenanceDocumentTotal(invoices);

  const appendixHtml =
    options?.includeAppendix && invoices.some((i) => i.document_id)
      ? await buildSellerPacketAppendixHtml(invoices as InvoiceRow[])
      : "";

  const html = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #0f172a; padding: 40px; }
          .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; margin: 0; }
          .subtitle { font-size: 14px; color: #64748b; margin-top: 5px; }
          .section { margin-bottom: 30px; }
          .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px; color: #0d9488; }
          .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
          .stat-card { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
          .stat-label { font-size: 12px; color: #64748b; font-weight: bold; margin-bottom: 5px; }
          .stat-value { font-size: 18px; font-weight: bold; }
          .table { width: 100%; border-collapse: collapse; }
          .table th { text-align: left; padding: 10px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 12px; }
          .table td { padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
          .footer { margin-top: 50px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px; }
          .total-row { background: #f1f5f9; font-weight: bold; }
          .plan-line { margin: 6px 0; font-size: 13px; line-height: 1.45; color: #334155; }
        </style>
      </head>
      <body>
        <div class="header">
          <p class="subtitle">BLUPRNT.AI — PROPERTY LEDGER</p>
          <h1 class="title">Property Improvement Ledger</h1>
          <p class="subtitle">Project: ${project.name} | Generated: ${formatShortUsDate(new Date().toISOString())}</p>
        </div>

        <div class="section">
          <h2 class="section-title">Investment Summary</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">CAPITAL IMPROVEMENTS</div>
              <div class="stat-value">${money(capitalTotal)}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">MAINTENANCE & LOGS</div>
              <div class="stat-value">${money(maintenanceTotal)}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">Plan vs documented spend</h2>
          ${planVsActualPdfLines(
            project.estimated_min_total,
            project.estimated_max_total,
            capitalTotal,
          )
            .map(
              (line) =>
                `<p class="plan-line">${line
                  .replace(/&/g, "&amp;")
                  .replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;")
                  .replace(/"/g, "&quot;")}</p>`,
            )
            .join("")}
        </div>

        <div class="section">
          <h2 class="section-title">Detailed Project Scope</h2>
          <table class="table">
            <thead>
              <tr>
                <th>CATEGORY</th>
                <th>DESCRIPTION</th>
                <th>BENCHMARK RANGE</th>
              </tr>
            </thead>
            <tbody>
              ${
                scopeItems.length === 0
                  ? '<tr><td colspan="3" style="text-align:center; padding: 20px;">No scope defined.</td></tr>'
                  : scopeItems
                      .map(
                        (s) => `
                <tr>
                  <td>${s.category}</td>
                  <td>${s.description}</td>
                  <td>${money(s.total_cost_min)} – ${money(s.total_cost_max)}</td>
                </tr>
              `,
                      )
                      .join("")
              }
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2 class="section-title">Recorded Costs</h2>
          <table class="table">
            <thead>
              <tr>
                <th>DATE</th>
                <th>VENDOR / DESCRIPTION</th>
                <th>TYPE</th>
                <th>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              ${
                invoices.length === 0
                  ? '<tr><td colspan="4" style="text-align:center; padding: 20px;">No records found.</td></tr>'
                  : invoices
                      .map(
                        (inv) => `
                <tr>
                  <td>${formatShortUsDate(inv.created_at)}</td>
                  <td>${inv.vendor_name || "Uncategorized"}</td>
                  <td>${(inv.document_type || "Invoice").charAt(0).toUpperCase() + (inv.document_type || "Invoice").slice(1)}</td>
                  <td>${money(inv.total)}</td>
                </tr>
              `,
                      )
                      .join("")
              }
              <tr class="total-row">
                <td colspan="3">TOTAL RECORDED VALUE</td>
                <td>${money(capitalTotal + maintenanceTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        ${appendixHtml}

        <div class="footer">
          BLUPRNT.AI — Includes regional estimate, plan vs documented spend, and uploaded records. Not a substitute for professional appraisal or tax advice.
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    const fileName = `property-ledger-${project.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.pdf`;

    // 1. Immediately show the share sheet for better perceived performance
    await Sharing.shareAsync(uri, { UTI: ".pdf", mimeType: "application/pdf" });

    // 2. Defer Cloud Save Sync to background to avoid blocking or lagging the UI
    InteractionManager.runAfterInteractions(async () => {
      try {
        // Small additional delay to ensure share sheet transition is smooth
        await new Promise((resolve) => setTimeout(resolve, 300));

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) return;

        const storagePath = `${project.id}/${session.user.id}/${fileName}`;
        const response = await fetch(uri);
        const blob = await response.blob();

        const { error: uploadErr } = await supabase.storage
          .from("project-documents")
          .upload(storagePath, blob, {
            contentType: "application/pdf",
            upsert: true,
          });

        if (!uploadErr) {
          await supabase.from("seller_packets").upsert(
            {
              project_id: project.id,
              property_id: project.property_id || "",
              storage_path: storagePath,
              generated_at: new Date().toISOString(),
            },
            { onConflict: "project_id" },
          );
        }
      } catch (e) {
        console.warn("Background PDF sync failed:", e);
      }
    });
  } catch (error) {
    console.error("PDF Generation Error:", error);
    throw error;
  }
}
