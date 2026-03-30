import React, { useState } from "react";
import { X, Plus, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";

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

interface AddScopeItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: {
    category: string;
    description: string;
    phase: string;
    cost: number;
    quantity: number;
    unit: string;
  }) => Promise<boolean>;
  saving: boolean;
}

export function AddScopeItemModal({
  isOpen,
  onClose,
  onAdd,
  saving,
}: AddScopeItemModalProps) {
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [phase, setPhase] = useState(PHASE_ORDER[0]);
  const [cost, setCost] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("ea");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const costNum = parseFloat(cost);
    const qtyNum = parseFloat(quantity);

    if (!category.trim() || isNaN(costNum)) return;

    const success = await onAdd({
      category: category.trim(),
      description: description.trim(),
      phase,
      cost: costNum,
      quantity: isNaN(qtyNum) ? 1 : qtyNum,
      unit: unit.trim() || "ea",
    });

    if (success) {
      setCategory("");
      setDescription("");
      setCost("");
      setQuantity("1");
      setUnit("ea");
      onClose();
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200"
          >
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-xl font-black tracking-tight text-slate-900">
                    Add Line Item
                  </h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Manual Budget Entry
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Item Name *
                  </label>
                  <input
                    autoFocus
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Custom Cabinetry, Smart Lighting..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                      Phase
                    </label>
                    <select
                      value={phase}
                      onChange={(e) => setPhase(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                    >
                      {PHASE_ORDER.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                      Estimated Unit Cost ($) *
                    </label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                      Unit
                    </label>
                    <input
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      placeholder="ea, sqft..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add more detail here..."
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={saving || !category.trim() || !cost}
                    className="w-full h-auto py-4 rounded-2xl premium-gradient text-white font-bold text-base shadow-xl shadow-indigo-200 gap-2"
                  >
                    {saving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Plus className="w-5 h-5" />
                    )}
                    {saving ? "Adding to budget..." : "Add to Budget"}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
