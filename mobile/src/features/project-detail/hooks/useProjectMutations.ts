import { useCallback } from "react";
import { Alert } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { dashboardQueryKey } from "@/lib/query-client";
import { friendlyPostgrestMutationError } from "@shared/lib/user-friendly-errors";
import type { ScopeRow } from "@shared/types/database";
import type { BillOfMaterialItem } from "@shared/types/onboarding";

interface UseProjectMutationsProps {
  id?: string;
  scope: ScopeRow[];
  setScope: React.Dispatch<React.SetStateAction<ScopeRow[]>>;
}

export function useProjectMutations({
  id,
  scope,
  setScope,
}: UseProjectMutationsProps) {
  const queryClient = useQueryClient();

  const updateScopeItemMaterials = useCallback(
    async (scopeItemId: string, materials: BillOfMaterialItem[]) => {
      const row = scope.find((s) => s.id === scopeItemId);
      if (!row || !id) return;

      const base =
        row.metadata && typeof row.metadata === "object"
          ? { ...row.metadata }
          : {};

      const nextMetadata = {
        ...base,
        materials: (materials ?? []).map((m) => ({
          ...m,
          quantity:
            typeof m.quantity === "string"
              ? parseFloat(m.quantity) || 0
              : (m.quantity ?? 0),
        })),
      };

      const { error } = await supabase
        .from("scope_items")
        .update({ metadata: nextMetadata })
        .eq("id", scopeItemId);

      if (error) {
        Alert.alert(
          "Couldn't update list",
          friendlyPostgrestMutationError(error),
        );
        return;
      }

      setScope((prev) =>
        prev.map((s) =>
          s.id === scopeItemId ? { ...s, metadata: nextMetadata } : s,
        ),
      );
      void queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
    },
    [scope, id, queryClient, setScope],
  );

  return { updateScopeItemMaterials };
}
