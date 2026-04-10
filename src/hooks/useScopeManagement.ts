import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import type { ScopeRow } from "@shared/types/database";

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
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<ScopeRow | null>(
    null,
  );
  const hasCelebratedRef = useRef(
    sessionStorage.getItem("bluprnt_scope_celebrated") === "true",
  );

  // Delegates to the authoritative DB function — prevents logic drift vs. mobile.
  const recalcProjectTotals = async () => {
    await supabase.rpc("recalc_project_totals", { p_id: projectId });
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
      toast.error("Couldn't save changes");
      setSaving(false);
      return;
    }

    await recalcProjectTotals();
    setSaving(false);

    if (!hasCelebratedRef.current) {
      hasCelebratedRef.current = true;
      sessionStorage.setItem("bluprnt_scope_celebrated", "true");
      toast.success("Budget updated — looking sharp! 🎉");
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } else {
      toast.success("Item updated");
    }
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
      toast.error("Couldn't remove item");
      setSaving(false);
      return;
    }

    await recalcProjectTotals();
    setSaving(false);
    toast.success("Item removed");
    onRefresh();
  };

  const startEdit = (item: ScopeRow) => {
    setEditingId(item.id);
    setEditQty(String(item.quantity ?? 1));
    setEditTier(item.finish_tier ?? "mid");
  };

  const addItem = async (newItem: {
    category: string;
    description: string;
    phase: string;
    cost: number;
    quantity?: number;
    unit?: string;
  }) => {
    setSaving(true);
    setError(null);

    const { error: err } = await supabase.from("scope_items").insert({
      project_id: projectId,
      category: newItem.category,
      description: newItem.description || "",
      phase: newItem.phase,
      quantity: newItem.quantity || 1,
      unit: newItem.unit || "ea",
      finish_tier: "mid",
      unit_cost_min: newItem.cost,
      unit_cost_max: newItem.cost,
      total_cost_min: newItem.cost * (newItem.quantity || 1),
      total_cost_max: newItem.cost * (newItem.quantity || 1),
    });

    if (err) {
      console.error("Add item error:", err);
      setError(err.message ?? "Couldn't add item");
      toast.error("Couldn't add item");
      setSaving(false);
      return false;
    }

    await recalcProjectTotals();
    toast.success("Item added to budget");
    onRefresh();
    setSaving(false);
    setIsAdding(false);
    return true;
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
    addItem,
    isAdding,
    setIsAdding,
  };
}
