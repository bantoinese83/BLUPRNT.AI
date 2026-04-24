import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Camera,
  Loader2,
  Image as ImageIcon,
  Activity,
  History,
  MessageSquare,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase, invokeFunction } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

import type { GalleryItemRow } from "@shared/types/database";

type GalleryItem = GalleryItemRow;

type TransformationVaultProps = {
  projectId: string;
  className?: string;
};

type PhotoSlotProps = {
  label: string;
  icon: React.ReactNode;
  item: GalleryItem | null;
  signedUrl: string | null;
  uploading: boolean;
  onUpload: () => void;
  onClear: (id: string) => void;
  onUpdateCaption: (id: string, caption: string) => void;
  error: boolean;
};

function PhotoSlot({
  label,
  icon,
  item,
  signedUrl,
  uploading,
  onUpload,
  onClear,
  onUpdateCaption,
  error,
}: PhotoSlotProps) {
  const [editingCaption, setEditingCaption] = useState(false);
  const [captionValue, setCaptionValue] = useState(item?.caption || "");

  const showPlaceholder = !signedUrl || error || !item;

  const handleSaveCaption = async () => {
    if (!item) return;
    try {
      onUpdateCaption(item.id, captionValue);
      setEditingCaption(false);
    } catch {
      setCaptionValue(item.caption || "");
    }
  };

  return (
    <div className="relative group aspect-square sm:aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-200/10 shadow-lg transition-all duration-300 hover:shadow-xl hover:ring-2 hover:ring-teal-500/20">
      {/* Background/Image */}
      {showPlaceholder ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100/50 backdrop-blur-sm p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-3 text-slate-300">
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
            ) : (
              <ImageIcon className="w-6 h-6" />
            )}
          </div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
            {label}
          </p>
          <p className="text-[10px] text-slate-400 mt-1 max-w-[140px]">
            No image selected yet
          </p>
        </div>
      ) : (
        <>
          <img
            src={signedUrl!}
            alt={label}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* Controls Overlay (Top) */}
          <div className="absolute top-3 right-3 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-[-4px] group-hover:translate-y-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingCaption(!editingCaption);
              }}
              className={cn(
                "p-1.5 rounded-lg backdrop-blur-md border transition-all",
                editingCaption
                  ? "bg-teal-500 text-white border-teal-400"
                  : "bg-black/20 border-white/10 text-white hover:bg-black/40",
              )}
              title="Edit caption"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClear(item.id);
              }}
              className="p-1.5 rounded-lg bg-black/20 hover:bg-rose-500/80 backdrop-blur-md border border-white/10 text-white transition-all"
              title={`Remove photo`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Caption Overlay (Bottom) */}
          <div className="absolute inset-x-0 bottom-0 z-20 p-4 bg-linear-to-t from-black/80 via-black/40 to-transparent pointer-events-none group-hover:pointer-events-auto">
            {editingCaption ? (
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={captionValue}
                  onChange={(e) => setCaptionValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveCaption()}
                  placeholder="Add a caption..."
                  className="flex-1 h-8 bg-white/20 backdrop-blur-lg border border-white/20 rounded-lg px-3 text-xs text-white placeholder:text-white/50 focus:outline-none focus:ring-1 focus:ring-white/40"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveCaption();
                  }}
                  className="w-8 h-8 rounded-lg bg-white text-slate-900 flex items-center justify-center hover:bg-teal-50"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              item.caption && (
                <p className="text-[11px] text-white/90 font-medium line-clamp-2 drop-shadow-sm">
                  {item.caption}
                </p>
              )
            )}
          </div>
        </>
      )}

      {/* Label Badge */}
      <div className="absolute top-3 left-3 z-10">
        <div className="px-2 py-1 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 flex items-center gap-1.5">
          {icon}
          <span className="text-[9px] font-black text-white uppercase tracking-wider">
            {label}
          </span>
        </div>
      </div>

      {/* Upload/Change Action Overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[2px]">
        {!editingCaption && (
          <button
            onClick={onUpload}
            disabled={uploading}
            className="bg-white text-slate-900 px-4 py-2 rounded-xl text-xs font-bold shadow-xl hover:bg-slate-50 active:scale-95 transition-all flex items-center gap-2"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
            {showPlaceholder ? `Capture ${label}` : `Change ${label}`}
          </button>
        )}
      </div>

      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-sm z-20">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      )}
    </div>
  );
}

export function TransformationVault({
  projectId,
  className,
}: TransformationVaultProps) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null); // "type-index"
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);
  const [targetIndex, setTargetIndex] = useState<number>(0);

  const fetchGallery = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("project_gallery")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Could not load gallery");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  // Group items into sets
  // A set is a logical grouping. For now, we'll just group them by their sequence.
  const sets = useMemo(() => {
    const befores = items.filter((i) => i.photo_type === "before");
    const afters = items.filter((i) => i.photo_type === "after");
    const count = Math.max(befores.length, afters.length, 1);

    const result = [];
    for (let i = 0; i < count; i++) {
      result.push({
        before: befores[i] || null,
        after: afters[i] || null,
      });
    }
    // Always provide an empty set at the end to allow adding a new one if the last one is full
    const last = result[result.length - 1];
    if (last && (last.before || last.after)) {
      result.push({ before: null, after: null });
    }

    return result;
  }, [items]);

  useEffect(() => {
    const fetchSignedUrls = async () => {
      const pathsToFetch = items
        .map((i) => i.storage_path)
        .filter((path) => !signedUrls[path]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "before" | "after",
    index: number,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(`${type}-${index}`);
    try {
      const fd = new FormData();
      fd.set("project_id", projectId);
      fd.set("file", file);
      fd.set("type", type);

      const { error: fnErr } = await invokeFunction<{ storagePath: string }>(
        "upload-gallery-photo",
        { body: fd },
      );

      if (fnErr) throw fnErr;
      toast.success("Photo uploaded successfully.");
      fetchGallery();
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload photo");
    } finally {
      setUploading(null);
      if (e.target) e.target.value = "";
    }
  };

  const handleClear = async (id: string) => {
    try {
      const { error } = await supabase
        .from("project_gallery")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("Photo removed");
      fetchGallery();
    } catch (err) {
      console.error(err);
      toast.error("Could not remove photo");
    }
  };

  const handleUpdateCaption = async (id: string, caption: string) => {
    try {
      const { error } = await supabase
        .from("project_gallery")
        .update({ caption })
        .eq("id", id);
      if (error) throw error;
      toast.success("Caption updated");
      fetchGallery();
    } catch (err) {
      console.error(err);
      toast.error("Could not update caption");
      throw err;
    }
  };

  const [activeSetIndex, setActiveSetIndex] = useState(0);

  if (loading) {
    return (
      <div className="h-48 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600/20" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between px-2">
        <div className="space-y-1">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Transformation Gallery
          </h3>
          <p className="text-[10px] text-slate-500 font-medium">
            Angle {activeSetIndex + 1} of {sets.length}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="w-7 h-7 rounded-lg border-slate-200"
            aria-label="Previous angle"
            disabled={activeSetIndex === 0}
            onClick={() => setActiveSetIndex((prev) => prev - 1)}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="w-7 h-7 rounded-lg border-slate-200"
            aria-label="Next angle"
            disabled={activeSetIndex === sets.length - 1}
            onClick={() => setActiveSetIndex((prev) => prev + 1)}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <input
        type="file"
        ref={beforeInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => handleFileChange(e, "before", targetIndex)}
      />
      <input
        type="file"
        ref={afterInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => handleFileChange(e, "after", targetIndex)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative">
        <PhotoSlot
          key={sets[activeSetIndex].before?.id || `before-${activeSetIndex}`}
          label="Baseline"
          icon={<History className="w-3 h-3 text-white" />}
          item={sets[activeSetIndex].before}
          signedUrl={
            sets[activeSetIndex].before
              ? signedUrls[sets[activeSetIndex].before!.storage_path]
              : null
          }
          uploading={uploading === `before-${activeSetIndex}`}
          onUpload={() => {
            setTargetIndex(activeSetIndex);
            beforeInputRef.current?.click();
          }}
          onClear={handleClear}
          onUpdateCaption={handleUpdateCaption}
          error={false}
        />
        <PhotoSlot
          key={sets[activeSetIndex].after?.id || `after-${activeSetIndex}`}
          label="Current"
          icon={<Activity className="w-3 h-3 text-teal-400" />}
          item={sets[activeSetIndex].after}
          signedUrl={
            sets[activeSetIndex].after
              ? signedUrls[sets[activeSetIndex].after!.storage_path]
              : null
          }
          uploading={uploading === `after-${activeSetIndex}`}
          onUpload={() => {
            setTargetIndex(activeSetIndex);
            afterInputRef.current?.click();
          }}
          onClear={handleClear}
          onUpdateCaption={handleUpdateCaption}
          error={false}
        />

        {/* Pagination Dots */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
          {sets.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveSetIndex(i)}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all",
                i === activeSetIndex
                  ? "bg-teal-500 w-4"
                  : "bg-slate-200 hover:bg-slate-300",
              )}
            />
          ))}
        </div>
      </div>

      {sets.length > 1 && (
        <div className="pt-6 flex justify-center">
          <button
            onClick={() => setActiveSetIndex(sets.length - 1)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add Another Angle
          </button>
        </div>
      )}
    </div>
  );
}
