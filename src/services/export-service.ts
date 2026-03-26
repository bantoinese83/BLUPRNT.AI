import { supabase } from "@/lib/supabase";

export async function exportUserData(userId: string, email: string) {
  const { data: props } = await supabase
    .from("properties")
    .select(
      "id, postal_code, city, state, country, approximate_location, created_at",
    );

  const propIds = (props ?? []).map((p) => p.id);

  const projsRes =
    propIds.length > 0
      ? await supabase.from("projects").select("*").in("property_id", propIds)
      : { data: [] };

  const projs = projsRes.data ?? [];
  const projectIds = projs.map((p) => p.id);

  let scopeItems: unknown[] = [];
  let invoices: unknown[] = [];
  let lineItems: unknown[] = [];
  let documents: unknown[] = [];

  if (projectIds.length > 0) {
    const [scopeRes, invRes, docsRes] = await Promise.all([
      supabase.from("scope_items").select("*").in("project_id", projectIds),
      supabase.from("invoices").select("*").in("project_id", projectIds),
      supabase
        .from("documents")
        .select("id, project_id, type, original_filename, created_at")
        .in("project_id", projectIds),
    ]);

    scopeItems = scopeRes.data ?? [];
    invoices = invRes.data ?? [];
    documents = docsRes.data ?? [];

    const invIds = (invRes.data ?? []).map((i: { id: string }) => i.id);
    if (invIds.length > 0) {
      const lineRes = await supabase
        .from("invoice_line_items")
        .select("*")
        .in("invoice_id", invIds);
      lineItems = lineRes.data ?? [];
    }
  }

  const exportData = {
    exported_at: new Date().toISOString(),
    user_id: userId,
    email: email,
    properties: props ?? [],
    projects: projs,
    scope_items: scopeItems,
    invoices,
    invoice_line_items: lineItems,
    documents,
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bluprnt-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
