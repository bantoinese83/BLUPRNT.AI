import { useQuery } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";

export type SignedUrlResponse = {
  signedUrl: string;
  filename?: string;
  error?: string;
};

export function useDocumentSignedUrl(
  supabase: SupabaseClient,
  ledgerEntryId: string,
  options?: { width?: number; height?: number; resize?: string },
) {
  return useQuery({
    queryKey: [
      "document-signed-url",
      ledgerEntryId,
      options?.width,
      options?.height,
      options?.resize,
    ],
    queryFn: async () => {
      const { data, error } =
        await supabase.functions.invoke<SignedUrlResponse>(
          "get-document-signed-url",
          {
            body: {
              ledger_entry_id: ledgerEntryId,
              ...options,
            },
          },
        );

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
    retry: 1,
  });
}
