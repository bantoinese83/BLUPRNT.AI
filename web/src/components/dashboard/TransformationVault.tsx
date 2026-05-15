import { useState, useRef, useEffect, useCallback } from "react";
import {
  Camera,
  Loader2,
  MessageSquare,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase, invokeFunction } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

import type { GalleryItemRow } from "@shared/types/database";
import { useTransformationVaultLogic } from "@shared/hooks/use-transformation-vault";
import { EDGE_FUNCTIONS } from "@shared/lib/backend-routing.js";
import { TRANSFORMATION_VAULT_COPY } from "@shared/copy/dashboard";

type GalleryItem = GalleryItemRow;

type TransformationVaultProps = {
  projectId: string;
  className?: string;
};

type PhotoSlotProps = {
  item: GalleryItem | null;
  signedUrl: string | null;
  uploading: boolean;
  onUpload: () => void;
  onClear: (id: string) => void;
  onUpdateCaption: (id: string, caption: string) => void;
  error: boolean;
};

function PhotoSlot({
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
    <div className="relative group mx-auto w-full max-w-2xl aspect-[4/3] max-h-[min(380px,50svh)] rounded-2xl overflow-hidden bg-slate-900 border border-slate-200/10 shadow-lg transition-all duration-300 hover:shadow-xl hover:ring-2 hover:ring-teal-500/20">
      {/* Background/Image */}
      {showPlaceholder ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50 backdrop-blur-sm p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4 ring-1 ring-slate-100">
            {uploading ? (
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            ) : (
              <img
                src="/bluprnt_logo.webp"
                alt="Logo"
                className="w-10 h-10 object-contain opacity-80"
              />
            )}
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
            Photo
          </p>
        </div>
      ) : (
        <>
          <img
            src={signedUrl!}
            alt="Transformation photo"
            className="absolute inset-0 w-full h-full object-contain transition-transform duration-700 group-hover:scale-[1.02]"
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

      {/* Upload/Capture Hint Overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 pointer-events-none">
        {onUpload && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpload();
            }}
            className="px-6 py-2.5 rounded-xl bg-white/90 backdrop-blur-md text-slate-900 text-xs font-bold shadow-2xl flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 pointer-events-auto hover:bg-white"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
            {showPlaceholder ? "Capture Photo" : "Change Photo"}
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
  const [_loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null); // "type-index"

  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);
  const [targetIndex, setTargetIndex] = useState<number>(0);
  const [activeSetIndex, setActiveSetIndex] = useState(0);

  const { sets, signedUrls, signedUrlsError, refreshSignedUrls } =
    useTransformationVaultLogic(projectId, items, supabase);

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
        EDGE_FUNCTIONS.UPLOAD_GALLERY_PHOTO,
        { body: fd },
      );

      if (fnErr) throw fnErr;
      toast.success(TRANSFORMATION_VAULT_COPY.uploadSuccess);
      fetchGallery();
    } catch (err) {
      console.error(err);
      toast.error(TRANSFORMATION_VAULT_COPY.uploadFailed);
    } finally {
      setUploading(null);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      const { error } = await supabase
        .from("project_gallery")
        .delete()
        .eq("id", id);
      if (error) throw error;
      fetchGallery();
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove photo");
    }
  };

  const handleUpdateCaption = async (id: string, caption: string) => {
    try {
      const { error } = await supabase
        .from("project_gallery")
        .update({ caption })
        .eq("id", id);
      if (error) throw error;
      fetchGallery();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update caption");
    }
  };

  const activeSet = sets[activeSetIndex];

  return (
    <div className={cn("space-y-6", className)}>
      <input
        type="file"
        ref={beforeInputRef}
        onChange={(e) => handleFileChange(e, "before", targetIndex)}
        className="hidden"
        accept="image/*"
      />
      <input
        type="file"
        ref={afterInputRef}
        onChange={(e) => handleFileChange(e, "after", targetIndex)}
        className="hidden"
        accept="image/*"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">
            Home story
          </p>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            {TRANSFORMATION_VAULT_COPY.title}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {TRANSFORMATION_VAULT_COPY.strap} · Angle {activeSetIndex + 1} of{" "}
            {Math.max(sets.length, 1)}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 shrink-0 sm:pt-0.5">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setActiveSetIndex((i) => Math.max(0, i - 1))}
            disabled={activeSetIndex === 0}
            className="h-9 w-9 rounded-xl border-slate-200/60"
            aria-label="Previous angle"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              setActiveSetIndex((i) => Math.min(sets.length - 1, i + 1))
            }
            disabled={activeSetIndex === sets.length - 1}
            className="h-9 w-9 rounded-xl border-slate-200/60"
            aria-label="Next angle"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {signedUrlsError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-amber-900 font-medium">
            {TRANSFORMATION_VAULT_COPY.signedUrlError}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 border-amber-300"
            onClick={() => void refreshSignedUrls()}
          >
            {TRANSFORMATION_VAULT_COPY.retry}
          </Button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Before
            </span>
          </div>
          <PhotoSlot
            item={activeSet?.before || null}
            signedUrl={
              activeSet?.before
                ? (signedUrls[activeSet.before.storage_path] ?? null)
                : null
            }
            uploading={uploading === `before-${activeSetIndex}`}
            onUpload={() => {
              setTargetIndex(activeSetIndex);
              beforeInputRef.current?.click();
            }}
            onClear={handleRemove}
            onUpdateCaption={handleUpdateCaption}
            error={Boolean(
              signedUrlsError &&
              activeSet?.before &&
              !signedUrls[activeSet.before.storage_path],
            )}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600/60">
              After
            </span>
          </div>
          <PhotoSlot
            item={activeSet?.after || null}
            signedUrl={
              activeSet?.after
                ? (signedUrls[activeSet.after.storage_path] ?? null)
                : null
            }
            uploading={uploading === `after-${activeSetIndex}`}
            onUpload={() => {
              setTargetIndex(activeSetIndex);
              afterInputRef.current?.click();
            }}
            onClear={handleRemove}
            onUpdateCaption={handleUpdateCaption}
            error={Boolean(
              signedUrlsError &&
              activeSet?.after &&
              !signedUrls[activeSet.after.storage_path],
            )}
          />
        </div>
      </div>

      {sets.length > 1 && (
        <div className="flex justify-center gap-1.5">
          {sets.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveSetIndex(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === activeSetIndex ? "w-6 bg-teal-500" : "w-1.5 bg-slate-200",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
