import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Paintbrush,
  Grid,
  Lightbulb,
  MoreHorizontal,
  Plus,
  Loader2,
  Trash2,
  MapPin,
  Camera,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { captureEvent } from "@/lib/posthog";
import type { PhysicalAssetRow } from "@shared/types/database";

type HomeSpecsVaultProps = {
  projectId: string;
  className?: string;
};

const CATEGORIES = [
  { id: "all", label: "All Specs", icon: <Grid className="w-3.5 h-3.5" /> },
  { id: "Paint", label: "Paint", icon: <Paintbrush className="w-3.5 h-3.5" /> },
  { id: "Tile", label: "Tile & Stone", icon: <Grid className="w-3.5 h-3.5" /> },
  {
    id: "Fixture",
    label: "Fixtures",
    icon: <Lightbulb className="w-3.5 h-3.5" />,
  },
  {
    id: "Other",
    label: "Other",
    icon: <MoreHorizontal className="w-3.5 h-3.5" />,
  },
];

export function HomeSpecsVault({ projectId, className }: HomeSpecsVaultProps) {
  const [assets, setAssets] = useState<PhysicalAssetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [isAdding, setIsAdding] = useState(false);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  const fetchAssets = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("physical_assets")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAssets(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Could not load home specs");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  useEffect(() => {
    const fetchSignedUrls = async () => {
      const pathsToFetch = assets
        .map((a) => a.storage_path)
        .filter((path): path is string => !!path && !signedUrls[path]);

      if (pathsToFetch.length === 0) return;

      const { data, error } = await supabase.storage
        .from("project-photos")
        .createSignedUrls(pathsToFetch, 3600);

      if (error) {
        console.error("Error creating signed URLs:", error);
        return;
      }

      if (data) {
        const newUrls: Record<string, string> = { ...signedUrls };
        data.forEach((item) => {
          if (item.signedUrl && item.path) {
            newUrls[item.path] = item.signedUrl;
          }
        });
        setSignedUrls(newUrls);
      }
    };

    fetchSignedUrls();
  }, [assets, signedUrls]);

  const filteredAssets = useMemo(() => {
    if (activeCategory === "all") return assets;
    return assets.filter((a) => a.category === activeCategory);
  }, [assets, activeCategory]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("physical_assets")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("Spec removed");
      captureEvent("asset_deleted", {
        category: assets.find((a) => a.id === id)?.category,
      });
      fetchAssets();
    } catch (err) {
      console.error(err);
      toast.error("Could not remove spec");
    }
  };

  if (loading) {
    return (
      <div className="h-48 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600/20" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
        <div className="space-y-1">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Physical Assets & Specs
          </h3>
          <p className="text-[10px] text-slate-500 font-medium">
            Permanent records of colors, finishes, and hardware
          </p>
        </div>
        <Button
          onClick={() => setIsAdding(true)}
          className="bg-slate-900 text-white hover:bg-slate-800 h-8 text-[10px] font-black uppercase tracking-widest px-4 rounded-xl shadow-lg shadow-slate-200"
        >
          <Plus className="w-3.5 h-3.5 mr-2" />
          Add New Spec
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border whitespace-nowrap",
              activeCategory === cat.id
                ? "bg-slate-900 text-white border-slate-900 shadow-md"
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300",
            )}
          >
            {cat.icon}
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2">
        {filteredAssets.length === 0 ? (
          <div className="col-span-full py-12 flex flex-col items-center justify-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4 text-slate-300">
              <Grid className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-900">No specs yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Start building your home's digital twin
            </p>
          </div>
        ) : (
          filteredAssets.map((asset) => (
            <Card
              key={asset.id}
              className="group relative overflow-hidden rounded-3xl border-slate-200/60 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="aspect-video w-full bg-slate-100 relative overflow-hidden">
                {asset.storage_path && signedUrls[asset.storage_path] ? (
                  <img
                    src={signedUrls[asset.storage_path]}
                    alt={asset.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 space-y-2">
                    <Camera className="w-8 h-8 opacity-20" />
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                      No Reference Photo
                    </span>
                  </div>
                )}
                <Badge className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-slate-900 border-none text-[9px] font-black uppercase tracking-tighter shadow-sm">
                  {asset.category}
                </Badge>
                <button
                  onClick={() => handleDelete(asset.id)}
                  className="absolute top-3 right-3 p-2 rounded-xl bg-white/90 backdrop-blur-sm text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-sm line-clamp-1">
                    {asset.name}
                  </h4>
                  {asset.location_in_home && (
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <MapPin className="w-3 h-3" />
                      <span className="text-[10px] font-medium">
                        {asset.location_in_home}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {asset.brand && (
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">
                        Brand
                      </span>
                      <span className="text-xs font-semibold text-slate-700">
                        {asset.brand}
                      </span>
                    </div>
                  )}
                  {asset.color_name && (
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">
                        Color
                      </span>
                      <span className="text-xs font-semibold text-slate-700">
                        {asset.color_name}
                      </span>
                    </div>
                  )}
                  {asset.color_code && (
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">
                        Code
                      </span>
                      <span className="text-xs font-semibold text-slate-700 font-mono">
                        {asset.color_code}
                      </span>
                    </div>
                  )}
                  {asset.finish && (
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">
                        Finish
                      </span>
                      <span className="text-xs font-semibold text-slate-700">
                        {asset.finish}
                      </span>
                    </div>
                  )}
                </div>

                {asset.notes && (
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-[11px] text-slate-500 italic leading-relaxed line-clamp-2">
                      "{asset.notes}"
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {isAdding && (
        <AddAssetModal
          projectId={projectId}
          onClose={() => setIsAdding(false)}
          onSuccess={() => {
            setIsAdding(false);
            fetchAssets();
          }}
        />
      )}
    </div>
  );
}

type AddAssetModalProps = {
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
};

function AddAssetModal({ projectId, onClose, onSuccess }: AddAssetModalProps) {
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
                {CATEGORIES.filter((c) => c.id !== "all").map((c) => (
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
