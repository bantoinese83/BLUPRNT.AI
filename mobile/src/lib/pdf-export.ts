import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { money } from "./formatters";
import { supabase } from "./supabase";

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
  id: string;
  property_id?: string;
  name: string;
  estimated_min_total: number | null;
  estimated_max_total: number | null;
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export async function generateSellerPacketPDF(
  project: ProjectInfo,
  scopeItems: ScopeItem[],
  invoices: InvoiceItem[],
) {
  const capitalTotal = invoices
    .filter((i) => {
      const t = (i.document_type || "invoice").toLowerCase();
      return t === "invoice" || t === "quote";
    })
    .reduce((s, i) => s + (i.total || 0), 0);

  const maintenanceTotal = invoices
    .filter((i) => {
      const t = (i.document_type || "").toLowerCase();
      return t === "warranty" || t === "permit";
    })
    .reduce((s, i) => s + (i.total || 0), 0);

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
          .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px; color: #4f46e5; }
          .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
          .stat-card { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
          .stat-label { font-size: 12px; color: #64748b; font-weight: bold; margin-bottom: 5px; }
          .stat-value { font-size: 18px; font-weight: bold; }
          .table { width: 100%; border-collapse: collapse; }
          .table th { text-align: left; padding: 10px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 12px; }
          .table td { padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
          .footer { margin-top: 50px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px; }
          .total-row { background: #f1f5f9; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <p class="subtitle">BLUPRNT.AI — VERIFIED RECORD</p>
          <h1 class="title">Property Improvement Ledger</h1>
          <p class="subtitle">Project: ${project.name} | Generated: ${formatDate(new Date().toISOString())}</p>
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
                  <td>${formatDate(inv.created_at)}</td>
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

        <div class="footer">
          This report was generated by BLUPRNT.AI. It serves as a professional record of home improvements to assist in property valuation and sale.
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });

    // Cloud Save Sync
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, 19);
      const storagePath = `${project.id}/${session.user.id}/seller-packet-${timestamp}.pdf`;

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
            property_id: project.property_id || null,
            storage_path: storagePath,
            generated_at: new Date().toISOString(),
          },
          { onConflict: "project_id" },
        );
      }
    }

    await Sharing.shareAsync(uri, { UTI: ".pdf", mimeType: "application/pdf" });
  } catch (error) {
    console.error("PDF Generation Error:", error);
    throw error;
  }
}
