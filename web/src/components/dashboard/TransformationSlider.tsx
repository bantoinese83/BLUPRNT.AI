import { useState } from "react";
import { MoveHorizontal, Camera, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

type TransformationSliderProps = {
  beforePath: string | null;
  afterPath: string | null;
  isArchitect?: boolean;
  hasProjectPass?: boolean;
  onUpgradeClick?: () => void;
  className?: string;
};

export function TransformationSlider({
  beforePath,
  afterPath,
  isArchitect,
  hasProjectPass,
  onUpgradeClick,
  className,
}: TransformationSliderProps) {
  const [sliderPos, setSliderPos] = useState(50);
  const isUnlocked = isArchitect || hasProjectPass;

  const getPublicUrl = (path: string | null) => {
    if (!path) return null;
    return supabase.storage.from("project-photos").getPublicUrl(path).data
      .publicUrl;
  };

  const beforeUrl = getPublicUrl(beforePath);
  const afterUrl = getPublicUrl(afterPath);

  if (!beforeUrl) {
    return (
      <div
        className={cn(
          "relative rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 aspect-[16/10] flex flex-col items-center justify-center text-center p-8",
          className,
        )}
      >
        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 text-slate-300">
          <Camera className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-900 mb-1">
          Visual Transformation
        </h4>
        <p className="text-[11px] text-slate-500 font-medium max-w-[200px]">
          Upload a starting photo of your space to track the transformation as
          you go.
        </p>
      </div>
    );
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
        onClick={() => {
          if (!isUnlocked) onUpgradeClick?.();
        }}
        onMouseMove={(e) => {
          if (!isUnlocked) return;
          if (e.buttons !== 1) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
          setSliderPos((x / rect.width) * 100);
        }}
        onTouchMove={(e) => {
          if (!isUnlocked) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const touch = e.touches[0];
          if (!touch) return;
          const x = Math.max(
            0,
            Math.min(touch.clientX - rect.left, rect.width),
          );
          setSliderPos((x / rect.width) * 100);
        }}
      >
        {/* Background Image (Now) */}
        <img
          src={afterUrl || beforeUrl}
          alt="Current state"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Foreground Image (Before) */}
        <div
          className="absolute inset-0 w-full h-full overflow-hidden border-r-2 border-white shadow-[4px_0_15px_rgba(0,0,0,0.3)]"
          style={{ width: `${isUnlocked ? sliderPos : 100}%` }}
        >
          <img
            src={beforeUrl}
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
            <div className="w-6 h-6 rounded-full bg-white shadow-xl flex items-center justify-center text-teal-600 cursor-grab active:cursor-grabbing border border-slate-200">
              <MoveHorizontal className="w-3.5 h-3.5" />
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/20 backdrop-blur-[2px]">
            <div className="bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 border border-white">
              <Lock className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-bold text-slate-900">
                Upgrade to compare
              </span>
            </div>
          </div>
        )}

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
