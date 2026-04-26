import { useState } from "react";
import { Camera, X, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { captureEvent } from "@/lib/posthog";

type AddAssetModalProps = {
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
  categories: { id: string; label: string }[];
};

export function AddAssetModal({
  projectId,
  onClose,
  onSuccess,
  categories,
}: AddAssetModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "Paint",
    brand: "",
    color_name: "",
    color_code: "",
    finish: "",
    location_in_home: "",
    notes: "",
  });
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let storagePath = null;
      if (file) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${projectId}/assets/${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("project-photos")
          .upload(fileName, file);

        if (uploadError) throw uploadError;
        storagePath = fileName;
      }

      const { error } = await supabase.from("physical_assets").insert({
        project_id: projectId,
        ...formData,
        storage_path: storagePath,
      });

      if (error) throw error;
      toast.success("Spec saved to vault");
      captureEvent("asset_created", { category: formData.category });
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save spec");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border-none animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">Add Home Spec</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Vault Entry
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-full space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                Asset Name
              </label>
              <input
                required
                className="w-full h-10 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm"
                placeholder="e.g. Living Room Accent Wall"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                Category
              </label>
              <select
                className="w-full h-10 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm appearance-none"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              >
                {categories
                  .filter((c) => c.id !== "all")
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                Location
              </label>
              <input
                className="w-full h-10 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm"
                placeholder="e.g. Master Bedroom"
                value={formData.location_in_home}
                onChange={(e) =>
                  setFormData({ ...formData, location_in_home: e.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                Brand
              </label>
              <input
                className="w-full h-10 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm"
                placeholder="e.g. Benjamin Moore"
                value={formData.brand}
                onChange={(e) =>
                  setFormData({ ...formData, brand: e.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                Color Name
              </label>
              <input
                className="w-full h-10 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm"
                placeholder="e.g. White Dove"
                value={formData.color_name}
                onChange={(e) =>
                  setFormData({ ...formData, color_name: e.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                Color Code
              </label>
              <input
                className="w-full h-10 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm font-mono"
                placeholder="e.g. OC-17"
                value={formData.color_code}
                onChange={(e) =>
                  setFormData({ ...formData, color_code: e.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                Finish
              </label>
              <input
                className="w-full h-10 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm"
                placeholder="e.g. Eggshell"
                value={formData.finish}
                onChange={(e) =>
                  setFormData({ ...formData, finish: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
              Photo Reference
            </label>
            <div className="relative group flex items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-6 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <div className="flex flex-col items-center gap-2">
                <Camera className="w-6 h-6 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {file ? file.name : "Click to upload photo"}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-xl h-12 text-[10px] font-black uppercase tracking-widest border-slate-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-2 rounded-xl h-12 bg-slate-900 text-white hover:bg-slate-800 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Save Spec to Vault"
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
