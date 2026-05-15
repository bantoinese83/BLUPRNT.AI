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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { captureEvent } from "@/lib/posthog";
import type { PhysicalAssetRow } from "@shared/types/database";
import { AddAssetModal } from "./vault/AddAssetModal";
import { AssetDetailModal } from "./vault/AssetDetailModal";

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
  const [limit, setLimit] = useState(6);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
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

  const selectedAsset = useMemo(
    () => assets.find((a) => a.id === selectedAssetId),
    [assets, selectedAssetId],
  );

  const handleDelete = async (id: string) => {
    const deleteAction = async () => {
      const { error } = await supabase
        .from("physical_assets")
        .delete()
        .eq("id", id);
      if (error) throw error;
      captureEvent("asset_deleted", {
        category: assets.find((a) => a.id === id)?.category,
      });
      if (selectedAssetId === id) setSelectedAssetId(null);
      fetchAssets();
    };

    toast.promise(deleteAction(), {
      loading: "Removing spec...",
      success: "Spec removed",
      error: "Could not remove spec",
    });
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
          className="bg-teal-600 text-white hover:bg-teal-700 h-8 text-[10px] font-black uppercase tracking-widest px-4 rounded-xl shadow-lg shadow-teal-100"
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
                ? "bg-teal-600 text-white border-teal-600 shadow-md"
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
          <>
            {filteredAssets.slice(0, limit).map((asset) => (
              <Card
                key={asset.id}
                onClick={() => setSelectedAssetId(asset.id)}
                className="group relative overflow-hidden rounded-2xl border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer active:scale-[0.98]"
              >
                <div className="flex">
                  <div className="w-24 sm:w-28 aspect-square bg-slate-50 relative overflow-hidden shrink-0 border-r border-slate-100 flex items-center justify-center p-1.5">
                    {asset.storage_path && signedUrls[asset.storage_path] ? (
                      <img
                        src={signedUrls[asset.storage_path]}
                        alt={asset.name}
                        className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110 drop-shadow-sm"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                        <Camera className="w-5 h-5 opacity-20" />
                      </div>
                    )}
                    <Badge className="absolute top-1.5 left-1.5 bg-teal-600 text-white border-none text-[8px] font-black uppercase tracking-tighter px-1 py-0 shadow-sm">
                      {asset.category}
                    </Badge>
                  </div>

                  <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-slate-900 text-xs truncate">
                          {asset.name}
                        </h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(asset.id);
                          }}
                          className="text-slate-300 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      {asset.location_in_home && (
                        <div className="flex items-center gap-1 text-slate-400">
                          <MapPin className="w-2.5 h-2.5" />
                          <span className="text-[9px] font-medium truncate">
                            {asset.location_in_home}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                      {asset.brand && (
                        <div className="min-w-0">
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block truncate">
                            Brand
                          </span>
                          <span className="text-[10px] font-bold text-slate-700 truncate block">
                            {asset.brand}
                          </span>
                        </div>
                      )}
                      {asset.color_name && (
                        <div className="min-w-0">
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block truncate">
                            Color
                          </span>
                          <span className="text-[10px] font-bold text-slate-700 truncate block">
                            {asset.color_name}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="text-[7px] font-black uppercase tracking-[0.2em] text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-full border border-teal-100">
                        View Details
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {filteredAssets.length > limit && (
              <button
                type="button"
                onClick={() => setLimit(filteredAssets.length)}
                className="col-span-full py-4 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-teal-600 transition-colors group"
              >
                <span>Show all {filteredAssets.length} specs</span>
                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-teal-50 transition-colors">
                  <Plus className="w-3 h-3" />
                </div>
              </button>
            )}
          </>
        )}
      </div>

      {isAdding && (
        <AddAssetModal
          projectId={projectId}
          categories={CATEGORIES}
          onClose={() => setIsAdding(false)}
          onSuccess={() => {
            setIsAdding(false);
            fetchAssets();
          }}
        />
      )}

      {selectedAsset && (
        <AssetDetailModal
          asset={selectedAsset}
          signedUrl={
            selectedAsset.storage_path
              ? signedUrls[selectedAsset.storage_path]
              : undefined
          }
          onClose={() => setSelectedAssetId(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
