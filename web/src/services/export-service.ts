/* eslint-disable @typescript-eslint/no-explicit-any */
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
      ? await supabase
          .from("projects")
          .select(
            "*, scope_items(*), ledger_entries(*, ledger_line_items(*)), documents(id, project_id, type, original_filename, created_at)",
          )
          .in("property_id", propIds)
      : { data: [] };

  const projsNested = projsRes.data ?? [];

  const projs = projsNested.map((p) => {
    const {
      scope_items: _s,
      ledger_entries: _i,
      documents: _d,
      ...rest
    } = p as any;
    return rest;
  });

  const scopeItems = projsNested.flatMap((p: any) => p.scope_items ?? []);
  const ledgerEntries = projsNested
    .flatMap((p: any) => p.ledger_entries ?? [])
    .map((inv: any) => {
      const { ledger_line_items: _li, ...rest } = inv;
      return rest;
    });
  const lineItems = projsNested
    .flatMap((p: any) => p.ledger_entries ?? [])
    .flatMap((inv: any) => inv.ledger_line_items ?? []);
  const documents = projsNested.flatMap((p: any) => p.documents ?? []);

  const exportData = {
    exported_at: new Date().toISOString(),
    user_id: userId,
    email: email,
    properties: props ?? [],
    projects: projs,
    scope_items: scopeItems,
    ledger_entries: ledgerEntries,
    ledger_line_items: lineItems,
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
