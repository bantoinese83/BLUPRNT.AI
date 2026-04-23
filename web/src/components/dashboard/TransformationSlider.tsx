import { useState, useRef } from "react";
import { MoveHorizontal, Lock, Loader2, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

type TransformationSliderProps = {
  projectId: string;
  beforePath: string | null;
  afterPath: string | null;
  isArchitect?: boolean;
  hasProjectPass?: boolean;
  onUpgradeClick?: () => void;
  onRefresh?: () => void;
  className?: string;
};

export function TransformationSlider({
  projectId,
  beforePath,
  afterPath,
  isArchitect,
  hasProjectPass,
  onUpgradeClick,
  onRefresh,
  className,
}: TransformationSliderProps) {
  const [sliderPos, setSliderPos] = useState(50);
  const [uploading, setUploading] = useState<"before" | "after" | null>(null);
  const isUnlocked = isArchitect || hasProjectPass;
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  const getPublicUrl = (path: string | null) => {
    if (!path) return null;
    return supabase.storage.from("project-documents").getPublicUrl(path).data
      .publicUrl;
  };

  const beforeUrl = getPublicUrl(beforePath);
  const afterUrl = getPublicUrl(afterPath);

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "before" | "after",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Photo is too large (max 10MB)");
      return;
    }

    setUploading(type);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");

      const ext = file.name.split(".").pop() || "jpg";
      const path = `${projectId}/${user.id}/${type}_hero_${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("project-documents")
        .upload(path, file);

      if (uploadErr) throw uploadErr;

      const updateData =
        type === "before"
          ? { before_photo_storage_path: path }
          : { after_photo_storage_path: path };

      const { error: updateErr } = await supabase
        .from("projects")
        .update(updateData)
        .eq("id", projectId);

      if (updateErr) throw updateErr;

      toast.success(`${type === "before" ? "Before" : "After"} photo updated`);
      onRefresh?.();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Failed to upload photo: ${msg}`);
    } finally {
      setUploading(null);
      if (e.target) e.target.value = "";
    }
  };

  const EmptyState = () => (
    <div
      className={cn(
        "relative rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 aspect-[16/10] flex flex-col items-center justify-center text-center p-8",
        className,
      )}
    >
      <input
        type="file"
        ref={beforeInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => handleFileChange(e, "before")}
      />
      <div className="w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center mb-4 p-2 ring-1 ring-slate-200/50">
        {uploading === "before" ? (
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        ) : (
          <img
            src="/bluprnt_logo.webp"
            alt="BLUPRNT"
            className="w-full h-full object-contain"
          />
        )}
      </div>
      <h4 className="text-sm font-bold text-slate-900 mb-1">
        Visual Transformation
      </h4>
      <p className="text-[11px] text-slate-500 font-medium max-w-[200px] mb-4">
        Upload a starting photo of your space to track the transformation as you
        go.
      </p>
      <button
        className="rounded-xl font-bold bg-white border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => beforeInputRef.current?.click()}
        disabled={!!uploading}
      >
        Upload Before Photo
      </button>
    </div>
  );

  if (!beforeUrl && !afterUrl) {
    return <EmptyState />;
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between px-2">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
          The Transformation
        </h3>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Before
          </span>
          <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">
            Now
          </span>
        </div>
      </div>

      <div
        className={cn(
          "relative rounded-3xl overflow-hidden bg-slate-900 aspect-[16/10] group select-none touch-none",
          !isUnlocked && "cursor-pointer",
        )}
      >
        {/* Hidden Inputs */}
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

        {/* Background Image (Now) */}
        <img
          src={afterUrl || beforeUrl || ""}
          alt="Current state"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Foreground Image (Before) */}
        <div
          className="absolute inset-0 w-full h-full overflow-hidden border-r-2 border-white shadow-[4px_0_15px_rgba(0,0,0,0.3)]"
          style={{ width: `${isUnlocked ? sliderPos : 100}%` }}
        >
          <img
            src={beforeUrl || afterUrl || ""}
            alt="Before"
            className="absolute inset-0 w-auto h-full object-cover max-w-none"
            style={{
              width: isUnlocked ? `${100 / (sliderPos / 100)}%` : "100%",
            }}
          />
        </div>

        {/* Handle */}
        {isUnlocked ? (
          <div
            className="absolute inset-y-0 z-10 flex items-center justify-center"
            style={{ left: `calc(${sliderPos}% - 12px)` }}
          >
            <div
              className="absolute inset-0 cursor-grab active:cursor-grabbing"
              onMouseMove={(e) => {
                if (e.buttons !== 1) return;
                const rect =
                  e.currentTarget.parentElement?.parentElement?.getBoundingClientRect();
                if (!rect) return;
                const x = Math.max(
                  0,
                  Math.min(e.clientX - rect.left, rect.width),
                );
                setSliderPos((x / rect.width) * 100);
              }}
            />
            <div className="w-6 h-6 rounded-full bg-white shadow-xl flex items-center justify-center text-teal-600 pointer-events-none border border-slate-200">
              <MoveHorizontal className="w-3.5 h-3.5" />
            </div>
          </div>
        ) : (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/20 backdrop-blur-[2px]"
            onClick={onUpgradeClick}
          >
            <div className="bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 border border-white">
              <Lock className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-bold text-slate-900">
                Upgrade to compare
              </span>
            </div>
          </div>
        )}

        {/* Main Slider Interaction Layer (Invisible) */}
        {isUnlocked && (
          <div
            className="absolute inset-0 z-[5] cursor-ew-resize"
            onMouseMove={(e) => {
              if (e.buttons !== 1) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const x = Math.max(
                0,
                Math.min(e.clientX - rect.left, rect.width),
              );
              setSliderPos((x / rect.width) * 100);
            }}
          />
        )}

        {/* Controls Overlay (Always visible on hover) */}
        <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={() => beforeInputRef.current?.click()}
            className="bg-black/40 backdrop-blur-md hover:bg-black/60 text-white px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2 transition-all"
            disabled={!!uploading}
          >
            {uploading === "before" ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <UploadCloud className="w-3 h-3" />
            )}
            <span className="text-[10px] font-bold uppercase tracking-tight">
              Before
            </span>
          </button>
          <button
            onClick={() => afterInputRef.current?.click()}
            className="bg-black/40 backdrop-blur-md hover:bg-black/60 text-white px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2 transition-all"
            disabled={!!uploading}
          >
            {uploading === "after" ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <UploadCloud className="w-3 h-3" />
            )}
            <span className="text-[10px] font-bold uppercase tracking-tight">
              After
            </span>
          </button>
        </div>

        {/* Labels overlay */}
        <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
          <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/90">
              {isUnlocked ? "Swipe to compare" : "Visual Timeline Locked"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
