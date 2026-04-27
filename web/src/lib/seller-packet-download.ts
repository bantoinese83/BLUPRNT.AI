import { supabase } from "@/lib/supabase";
import { generateSellerPacketBlob } from "@/lib/pdf-export";
import { buildSellerPacketAppendixItems } from "@/lib/seller-packet-appendix";
import type { LedgerEntryRow } from "@shared/types/database";

export type SellerPacketScopeInput = {
  category: string;
  description: string;
  total_cost_min: number | null;
  total_cost_max: number | null;
};

export type SellerPacketProjectInput = {
  name: string;
  estimated_min_total: number | null;
  estimated_max_total: number | null;
};

export type DownloadSellerPacketParams = {
  projectId: string;
  propertyId: string;
  project: SellerPacketProjectInput;
  scopeItems: SellerPacketScopeInput[];
  ledgerEntries: LedgerEntryRow[];
  /** When true, fetches originals and may embed images (larger PDF). */
  includeAppendix?: boolean;
};

/**
 * Builds the full property ledger / seller packet PDF, triggers download,
 * and saves a copy to project storage when the user is signed in.
 */
export async function downloadSellerPacket({
  projectId,
  propertyId,
  project,
  scopeItems,
  ledgerEntries,
  includeAppendix = false,
}: DownloadSellerPacketParams): Promise<{ savedToProject: boolean }> {
  const appendixItems = includeAppendix
    ? await buildSellerPacketAppendixItems(ledgerEntries)
    : [];
  const blob = await generateSellerPacketBlob(
    project,
    scopeItems,
    ledgerEntries,
    appendixItems.length > 0 ? { appendixItems } : undefined,
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const storagePath = userId
    ? `${projectId}/${userId}/seller-packet-${timestamp}.pdf`
    : `${projectId}/seller-packet-${timestamp}.pdf`;

  let savedToProject = false;
  if (userId) {
    const { error: uploadErr } = await supabase.storage
      .from("project-documents")
      .upload(storagePath, blob, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (!uploadErr) {
      await supabase.from("seller_packets").upsert(
        {
          project_id: projectId,
          property_id: propertyId,
          storage_path: storagePath,
          generated_at: new Date().toISOString(),
        },
        { onConflict: "project_id" },
      );
      savedToProject = true;
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `property-ledger-${project.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.pdf`;
  a.click();
  URL.revokeObjectURL(url);

  return { savedToProject };
}
