import { useNavigate } from "react-router-dom";
import { ListTree, Rocket, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useScopeManagement } from "@/hooks/useScopeManagement";
import { ScopeHeader } from "./ScopeHeader";
import { ScopeSummary } from "./ScopeSummary";
import { ScopeItemRow } from "./ScopeItemRow";
import type { ProjectRow, ScopeRow } from "@/types/database";

const PHASE_ORDER = [
  "Site Prep",
  "Demolition",
  "Structural",
  "Rough-in",
  "Drywall",
  "Finishes",
  "Fixtures",
  "Appliances",
  "Cleanup",
];

export function ScopeDetail({
  project,
  scopeItems,
  projectId,
  onRefresh,
  isArchitect,
  hasProjectPass,
}: {
  project: ProjectRow;
  scopeItems: ScopeRow[];
  projectId: string;
  onRefresh: () => void;
  isArchitect?: boolean;
  hasProjectPass?: boolean;
}) {
  const navigate = useNavigate();
  const {
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
  } = useScopeManagement({ projectId, onRefresh });

  const conf = project.confidence_score ?? 4.5;

  const groupedItems = scopeItems.reduce(
    (acc, item) => {
      const phase = item.phase || item.metadata?.phase || "General";
      if (!acc[phase]) acc[phase] = [];
      acc[phase].push(item);
      return acc;
    },
    {} as Record<string, ScopeRow[]>,
  );

  const sortedPhases = Object.entries(groupedItems).sort(([a], [b]) => {
    const idxA = PHASE_ORDER.indexOf(a);
    const idxB = PHASE_ORDER.indexOf(b);
    if (idxA === -1 && idxB === -1) return a.localeCompare(b);
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });

  return (
    <div className="space-y-6">
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-semibold text-slate-900">
              Remove from budget?
            </h3>
            <p className="text-slate-600 text-sm">
              &quot;{deleteConfirmItem.category}&quot; will be removed from your
              budget breakdown. You can add it back later if needed.
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
                onClick={confirmDelete}
                disabled={saving}
                type="button"
                className="gap-2 bg-amber-600 hover:bg-amber-700"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}

      <ScopeHeader projectName={project.name} error={error} />

      <Card className="overflow-hidden">
        <ScopeSummary
          minTotal={project.estimated_min_total}
          maxTotal={project.estimated_max_total}
          confidenceScore={conf}
        />
        <CardContent className="p-0">
          {scopeItems.length === 0 ? (
            <div className="p-10 sm:p-14 flex flex-col items-center text-center max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <ListTree className="w-7 h-7 text-slate-400" aria-hidden />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">
                No line items yet
              </h3>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                <strong className="text-slate-800">Next step:</strong> Run the
                estimate flow once to generate your kitchen, bath, or remodel
                breakdown—or ask support if you expected data here.
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
              {sortedPhases.map(([phase, items]) => (
                <div key={phase} className="space-y-0">
                  <div className="bg-slate-50/80 px-4 py-2 border-y border-slate-100">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      {phase}
                    </h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {items.map((item) => (
                      <ScopeItemRow
                        key={item.id}
                        item={item}
                        isEditing={editingId === item.id}
                        onEdit={startEdit}
                        onDelete={setDeleteConfirmItem}
                        onCancelEdit={() => setEditingId(null)}
                        onSave={handleSave}
                        editQty={editQty}
                        setEditQty={setEditQty}
                        editTier={editTier}
                        setEditTier={setEditTier}
                        saving={saving}
                        isArchitect={isArchitect}
                        hasProjectPass={hasProjectPass}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
