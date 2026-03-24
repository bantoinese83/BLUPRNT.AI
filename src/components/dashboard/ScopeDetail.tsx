import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, Loader2, ListTree, Rocket } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

import type { ProjectRow, ScopeRow } from "@/types/database";

import { money, getStars as stars } from "@/lib/formatters";

const TIERS = ["economy", "mid", "premium"] as const;

export function ScopeDetail({
  project,
  scopeItems,
  projectId,
  onRefresh,
}: {
  project: ProjectRow;
  scopeItems: ScopeRow[];
  projectId: string;
  onRefresh: () => void;
}) {
  const navigate = useNavigate();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState<string>("");
  const [editTier, setEditTier] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<ScopeRow | null>(null);

  const conf = project.confidence_score ?? 4.5;

  async function handleSave(item: ScopeRow) {
    let qty = parseFloat(editQty || "0");
    if (Number.isNaN(qty) || qty < 0) qty = 0;
    if (qty > 1000000) qty = 1000000;

    setEditQty(String(qty));
    setSaving(true);
    setError(null);
    const oldMult = item.finish_tier === "economy" ? 0.85 : item.finish_tier === "premium" ? 1.2 : 1;
    const newMult = editTier === "economy" ? 0.85 : editTier === "premium" ? 1.2 : 1;
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
    setSaving(false);
    if (err) {
      setError(err.message ?? "Couldn't save changes");
      return;
    }
    await recalcProjectTotals();
    setEditingId(null);
    onRefresh();
  }

  async function recalcProjectTotals() {
    const { data: items } = await supabase
      .from("scope_items")
      .select("total_cost_min, total_cost_max")
      .eq("project_id", projectId);
    if (!items?.length) return;
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
  }

  async function handleDelete(item: ScopeRow) {
    setDeleteConfirmItem(item);
  }

  async function confirmDelete() {
    const item = deleteConfirmItem;
    if (!item) return;
    setDeleteConfirmItem(null);
    setSaving(true);
    setError(null);
    const { error: err } = await supabase
      .from("scope_items")
      .delete()
      .eq("id", item.id);
    setSaving(false);
    if (err) {
      setError(err.message ?? "Couldn't remove item");
      return;
    }
    await recalcProjectTotals();
    onRefresh();
  }

  function startEdit(item: ScopeRow) {
    setEditingId(item.id);
    setEditQty(String(item.quantity ?? 1));
    setEditTier(item.finish_tier ?? "mid");
  }

  return (
    <div className="space-y-6">
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-semibold text-slate-900">Remove from budget?</h3>
            <p className="text-slate-600 text-sm">
              &quot;{deleteConfirmItem.category}&quot; will be removed from your budget breakdown. You can add it back later if needed.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteConfirmItem(null)}
                type="button"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => confirmDelete()}
                disabled={saving}
                type="button"
                className="gap-2 bg-amber-600 hover:bg-amber-700"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : null}
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-slate-600"
          onClick={() => navigate("/dashboard/plan")}
          type="button"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          Back to plan
        </Button>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Line-by-line costs
        </h2>
        <p className="text-slate-500">
          Detailed breakdown for {project.name}. Tap an item to edit quantity or tier.
        </p>
        {error && (
          <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </div>

      <Card className="overflow-hidden">
        <div className="bg-slate-900 text-white p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-slate-400 text-sm font-medium">Estimated total</p>
            <div className="text-3xl font-bold tracking-tight">
              {money(project.estimated_min_total, project.estimated_max_total)}
            </div>
          </div>
          <Badge className="bg-slate-800 text-slate-300 border-slate-700">
            Confidence: {conf}/5
          </Badge>

        </div>
        <CardContent className="p-0">
          {scopeItems.length === 0 ? (
            <div className="p-10 sm:p-14 flex flex-col items-center text-center max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <ListTree className="w-7 h-7 text-slate-400" aria-hidden />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">No line items yet</h3>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                <strong className="text-slate-800">Next step:</strong> Run the estimate flow once to generate your kitchen, bath, or remodel breakdown—or ask support if you expected data here.
              </p>
              <Button
                type="button"
                variant="primary"
                className="gap-2 rounded-xl w-full sm:w-auto"
                onClick={() => navigate("/onboarding")}
              >
                <Rocket className="w-4 h-4 shrink-0" aria-hidden />
                Start or redo estimate
              </Button>
            </div>
          ) : (
          <div className="divide-y divide-slate-100">
            {scopeItems.map((item) => {
              const isEditing = editingId === item.id;
              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-6 flex flex-col gap-4 hover:bg-slate-50 transition-colors"
                >
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-slate-900">{item.category}</h4>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingId(null)}
                            disabled={saving}
                            type="button"
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleSave(item)}
                            disabled={saving}
                            type="button"
                            className="gap-2"
                          >
                            {saving ? (
                              <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                            ) : null}
                            Save
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-slate-700" htmlFor={`qty-${item.id}`}>
                            Quantity
                          </label>
                          <input
                            id={`qty-${item.id}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={editQty}
                            onChange={(e) => setEditQty(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-700"
                          />
                          {item.unit && (
                            <span className="text-xs text-slate-500 ml-2">{item.unit}</span>
                          )}
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-700" htmlFor={`tier-${item.id}`}>
                            Finish tier
                          </label>
                          <select
                            id={`tier-${item.id}`}
                            value={editTier}
                            onChange={(e) => setEditTier(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-700"
                          >
                            {TIERS.map((t) => (
                              <option key={t} value={t}>
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-2">
                          <h4 className="font-semibold text-slate-900">{item.category}</h4>
                          {item.finish_tier && (
                            <Badge variant="outline" className="text-xs capitalize">
                              {item.finish_tier}
                            </Badge>
                          )}
                          <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => startEdit(item)}
                                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                                aria-label="Edit"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(item)}
                                className="p-1.5 text-slate-500 hover:text-amber-600 rounded-lg hover:bg-amber-50"
                                aria-label="Remove"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                        </div>
                        <p className="text-sm text-slate-500">{item.description}</p>
                        <div className="flex items-center gap-1 text-xs font-medium">
                          {stars(item.confidence_score)}
                          <span className="ml-1 text-slate-500">Regional pricing accuracy</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 space-y-1">
                        <div className="font-semibold text-slate-900">
                          {money(item.total_cost_min, item.total_cost_max)}
                        </div>
                        {item.quantity != null && item.unit && (
                          <div className="text-sm text-slate-500">
                            {item.quantity} {item.unit}
                            {item.unit_cost_min != null && item.unit_cost_max != null && (
                              <span className="block text-xs">
                                {money(item.unit_cost_min, item.unit_cost_max)} per {item.unit}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
