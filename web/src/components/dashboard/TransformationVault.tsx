import { useState, useRef, useEffect } from "react";
import {
  Camera,
  Loader2,
  Image as ImageIcon,
  History,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

type TransformationVaultProps = {
  projectId: string;
  beforePath: string | null;
  afterPath: string | null;
  onRefresh?: () => void;
  className?: string;
};

type PhotoSlotProps = {
  label: string;
  icon: React.ReactNode;
  path: string | null;
  url: string | null;
  uploading: boolean;
  onUpload: () => void;
  onClear: () => void;
  error: boolean;
  type: "before" | "after";
};

function PhotoSlot({
  label,
  icon,
  path,
  url,
  uploading,
  onUpload,
  onClear,
  error,
}: PhotoSlotProps) {
  const showPlaceholder = !url || error || !path;

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
            No hero image selected yet
          </p>
        </div>
      ) : (
        <>
          <img
            src={url!}
            alt={label}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* Clear Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="absolute top-3 right-3 z-20 p-1.5 rounded-lg bg-black/20 hover:bg-rose-500/80 backdrop-blur-md border border-white/10 text-white transition-all opacity-0 group-hover:opacity-100"
            title={`Clear ${label} photo`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
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
  beforePath,
  afterPath,
  onRefresh,
  className,
}: TransformationVaultProps) {
  const [uploading, setUploading] = useState<"before" | "after" | null>(null);
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  const [beforeUrl, setBeforeUrl] = useState<string | null>(null);
  const [afterUrl, setAfterUrl] = useState<string | null>(null);
  const [beforeError, setBeforeError] = useState(false);
  const [afterError, setAfterError] = useState(false);

  // Use a cache to avoid repeated failed lookups for the same session
  const failedPathsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    const fetchSignedUrls = async () => {
      // 1. Before Path
      if (beforePath && !failedPathsRef.current.has(beforePath)) {
        const { data, error } = await supabase.storage
          .from("project-documents")
          .createSignedUrl(beforePath, 3600);
        if (active) {
          if (error) {
            setBeforeError(true);
            failedPathsRef.current.add(beforePath);
          } else {
            setBeforeUrl(data?.signedUrl ?? null);
            setBeforeError(false);
          }
        }
      } else if (active) {
        setBeforeUrl(null);
        setBeforeError(false);
      }

      // 2. After Path
      if (afterPath && !failedPathsRef.current.has(afterPath)) {
        const { data, error } = await supabase.storage
          .from("project-documents")
          .createSignedUrl(afterPath, 3600);
        if (active) {
          if (error) {
            setAfterError(true);
            failedPathsRef.current.add(afterPath);
          } else {
            setAfterUrl(data?.signedUrl ?? null);
            setAfterError(false);
          }
        }
      } else if (active) {
        setAfterUrl(null);
        setAfterError(false);
      }
    };

    void fetchSignedUrls();
    return () => {
      active = false;
    };
  }, [beforePath, afterPath]);

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "before" | "after",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Photo too large (max 10MB)");
      return;
    }

    setUploading(type);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");

      const ext = file.name.split(".").pop() || "jpg";
      const path = `${projectId}/${user.id}/vault_${type}_${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("project-documents")
        .upload(path, file);
      if (upErr) throw upErr;

      const updateData =
        type === "before"
          ? { before_photo_storage_path: path }
          : { after_photo_storage_path: path };

      const { error: dbErr } = await supabase
        .from("projects")
        .update(updateData)
        .eq("id", projectId);
      if (dbErr) throw dbErr;

      // Remove from failed cache since we have a new path
      failedPathsRef.current.delete(path);

      toast.success(
        `${type === "before" ? "Baseline" : "Current state"} updated`,
      );
      onRefresh?.();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Failed to save photo";
      toast.error(msg);
    } finally {
      setUploading(null);
      if (e.target) e.target.value = "";
    }
  };

  const handleClear = async (type: "before" | "after") => {
    try {
      const updateData =
        type === "before"
          ? { before_photo_storage_path: null }
          : { after_photo_storage_path: null };

      const { error } = await supabase
        .from("projects")
        .update(updateData)
        .eq("id", projectId);
      if (error) throw error;

      if (type === "before") setBeforeUrl(null);
      else setAfterUrl(null);

      toast.success(
        `${type === "before" ? "Baseline" : "Current"} photo removed`,
      );
      onRefresh?.();
    } catch (err) {
      console.error(err);
      toast.error("Could not remove photo");
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between px-2">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          The Transformation Vault
        </h3>
        <Sparkles className="w-3.5 h-3.5 text-teal-500 animate-pulse" />
      </div>

      <input
        type="file"
        ref={beforeInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => handleFileChange(e, "before")}
      />
      <input
        type="file"
        ref={afterInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => handleFileChange(e, "after")}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PhotoSlot
          type="before"
          label="Baseline"
          icon={<History className="w-3 h-3 text-white" />}
          path={beforePath}
          url={beforeUrl}
          uploading={uploading === "before"}
          onUpload={() => beforeInputRef.current?.click()}
          onClear={() => handleClear("before")}
          error={beforeError}
        />
        <PhotoSlot
          type="after"
          label="Current"
          icon={<Sparkles className="w-3 h-3 text-teal-400" />}
          path={afterPath}
          url={afterUrl}
          uploading={uploading === "after"}
          onUpload={() => afterInputRef.current?.click()}
          onClear={() => handleClear("after")}
          error={afterError}
        />
      </div>
    </div>
  );
}
