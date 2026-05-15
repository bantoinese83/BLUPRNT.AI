import "@supabase/functions-js/edge-runtime.d.ts";
import { zipSync } from "fflate";
import { getCorsHeaders, handleOptions, jsonResponse } from "../_shared/cors.ts";
import { getServiceClient, getUserIdFromRequest } from "../_shared/auth.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";

const MAX_FILES_TO_EXPORT = 50;

function toCsv(data: any[]): string {
  if (!data.length) return "";
  const headers = Object.keys(data[0]);
  const rows = data.map(obj => 
    headers.map(h => {
      const val = obj[h];
      if (val === null || val === undefined) return "";
      const str = String(val).replace(/"/g, '""');
      return str.includes(",") || str.includes("\n") || str.includes('"') ? `"${str}"` : str;
    }).join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

export const handler = async (req: Request): Promise<Response> => {
  const opt = handleOptions(req);
  if (opt) return opt;

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, req);
  }

  const { ok, retryAfter } = await checkRateLimit(req);
  if (!ok) {
    return jsonResponse(
      { error: "Too many export requests. Please try again later." },
      429,
      req,
      retryAfter ?? 300,
    );
  }

  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return jsonResponse({ error: "Unauthorized" }, 401, req);
  }

  try {
    const admin = getServiceClient();

    // 1. Fetch Data
    const { data: props } = await admin
      .from("properties")
      .select("*")
      .eq("owner_user_id", userId);
    
    const propIds = (props ?? []).map(p => p.id);
    
    const { data: projects } = propIds.length > 0 
      ? await admin.from("projects").select("*").in("property_id", propIds)
      : { data: [] };
    
    const projectIds = (projects ?? []).map(p => p.id);
    
    const [scopeRes, ledgerRes, docsRes] = projectIds.length > 0 
      ? await Promise.all([
          admin.from("scope_items").select("*").in("project_id", projectIds),
          admin.from("ledger_entries").select("*").in("project_id", projectIds),
          admin.from("documents").select("*").in("project_id", projectIds),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }];

    const scopeItems = scopeRes.data ?? [];
    const ledgerEntries = ledgerRes.data ?? [];
    const documents = docsRes.data ?? [];

    const entryIds = ledgerEntries.map(e => e.id);
    const { data: lineItems } = entryIds.length > 0 
      ? await admin.from("ledger_line_items").select("*").in("ledger_entry_id", entryIds)
      : { data: [] };

    // 2. Prepare JSON Bundle
    const exportJson = JSON.stringify({
      exported_at: new Date().toISOString(),
      user_id: userId,
      properties: props,
      projects,
      scope_items: scopeItems,
      ledger_entries: ledgerEntries,
      ledger_line_items: lineItems,
      documents,
    }, null, 2);

    // 3. Prepare CSVs
    const ledgerCsv = toCsv(ledgerEntries);
    const scopeCsv = toCsv(scopeItems);

    // 4. Collect Files (Limit to avoid timeouts)
    const zipData: Record<string, Uint8Array> = {
      "data.json": new TextEncoder().encode(exportJson),
      "ledger_summary.csv": new TextEncoder().encode(ledgerCsv),
      "scope_items.csv": new TextEncoder().encode(scopeCsv),
    };

    // Optionally include the first N documents if they are small
    const docsToFetch = documents.slice(0, MAX_FILES_TO_EXPORT);
    for (const doc of docsToFetch) {
      if (!doc.storage_path) continue;
      try {
        const { data: blob, error } = await admin.storage
          .from("project-documents")
          .download(doc.storage_path);
        
        if (!error && blob) {
          const arr = new Uint8Array(await blob.arrayBuffer());
          const safeName = doc.original_filename?.replace(/[\/\\?%*:|"<>]/g, '_') || `file_${doc.id}`;
          zipData[`documents/${safeName}`] = arr;
        }
      } catch (e) {
        console.warn(`Failed to export file ${doc.storage_path}:`, e);
      }
    }

    // 5. Generate ZIP
    const zipped = zipSync(zipData);

    return new Response(zipped, {
      status: 200,
      headers: {
        ...getCorsHeaders(req),
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="bluprnt-export-${new Date().toISOString().slice(0, 10)}.zip"`,
      },
    });
  } catch (e) {
    console.error("[generate-data-export] error:", e);
    return jsonResponse({ error: "Export failed." }, 500, req);
  }
};

if (import.meta.main) {
  Deno.serve(handler);
}
