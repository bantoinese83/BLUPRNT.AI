import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { ScopeRow } from "@/types/database";

interface UseScopeManagementProps {
  projectId: string;
  onRefresh: () => void;
}

export function useScopeManagement({
  projectId,
  onRefresh,
}: UseScopeManagementProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState<string>("");
  const [editTier, setEditTier] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<ScopeRow | null>(
    null,
  );

  const recalcProjectTotals = async () => {
    const { data: items } = await supabase
      .from("scope_items")
      .select("total_cost_min, total_cost_max")
      .eq("project_id", projectId);

    if (!items?.length) {
      await supabase
        .from("projects")
        .update({
          estimated_min_total: 0,
          estimated_max_total: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId);
      return;
    }

    const minSum = items.reduce((s, i) => s + (i.total_cost_min ?? 0), 0);
    const maxSum = items.reduce((s, i) => s + (i.total_cost_max ?? 0), 0);

    await supabase
      .from("projects")
      .update({
        estimated_min_total: Math.round(minSum),
        estimated_max_total: Math.round(maxSum),
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);
  };

  const handleSave = async (item: ScopeRow) => {
    let qty = parseFloat(editQty || "0");
    if (Number.isNaN(qty) || qty < 0) qty = 0;
    if (qty > 1000000) qty = 1000000;

    setEditQty(String(qty));
    setSaving(true);
    setError(null);

    const oldMult =
      item.finish_tier === "economy"
        ? 0.85
        : item.finish_tier === "premium"
          ? 1.2
          : 1;
    const newMult =
      editTier === "economy" ? 0.85 : editTier === "premium" ? 1.2 : 1;

    const ucMin = Math.round((item.unit_cost_min ?? 0) * (newMult / oldMult));
    const ucMax = Math.round((item.unit_cost_max ?? 0) * (newMult / oldMult));
    const newTotalMin = Math.round(qty * ucMin);
    const newTotalMax = Math.round(qty * ucMax);

    const { error: err } = await supabase
      .from("scope_items")
      .update({
        quantity: qty,
        finish_tier: editTier,
        unit_cost_min: ucMin,
        unit_cost_max: ucMax,
        total_cost_min: newTotalMin,
        total_cost_max: newTotalMax,
      })
      .eq("id", item.id);

    if (err) {
      setError(err.message ?? "Couldn't save changes");
      setSaving(false);
      return;
    }

    await recalcProjectTotals();
    setSaving(false);
    setEditingId(null);
    onRefresh();
  };

  const confirmDelete = async () => {
    const item = deleteConfirmItem;
    if (!item) return;
    setDeleteConfirmItem(null);
    setSaving(true);
    setError(null);

    const { error: err } = await supabase
      .from("scope_items")
      .delete()
      .eq("id", item.id);

    if (err) {
      setError(err.message ?? "Couldn't remove item");
      setSaving(false);
      return;
    }

    await recalcProjectTotals();
    setSaving(false);
    onRefresh();
  };

  const startEdit = (item: ScopeRow) => {
    setEditingId(item.id);
    setEditQty(String(item.quantity ?? 1));
    setEditTier(item.finish_tier ?? "mid");
  };

  return {
    editingId,
    setEditingId,
    editQty,
    setEditQty,
    editTier,
    setEditTier,
    saving,
    error,
    deleteConfirmItem,
    setDeleteConfirmItem,
    handleSave,
    confirmDelete,
    startEdit,
  };
}
