import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, ImagePlus, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageTransition } from "./PageTransition";
import { useOnboarding } from "@/hooks/use-onboarding";

export function PhotoScreen() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const { photos, setPhotos } = useOnboarding();

  function onFiles(files: FileList | null) {
    if (!files?.length) return;

    const validFiles = Array.from(files).filter((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`"${file.name}" is too large. Max 10MB per photo.`);
        return false;
      }
      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        toast.error(
          `"${file.name}" is not a supported format (JPEG, PNG, WEBP).`,
        );
        return false;
      }
      return true;
    });

    const next = [...photos, ...validFiles].slice(0, 10);
    setPhotos(next);
  }

  return (
    <PageTransition>
      <div className="space-y-8">
        <div className="space-y-2 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Vision-Match Your Room
          </h2>
          <p className="text-slate-500 text-lg">
            Snap a photo or upload from gallery for a high-fidelity estimate.
          </p>
        </div>

        {/* Hidden inputs for two different experiences */}
        <input
          ref={inputRef}
          id="gallery-upload"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            onFiles(e.target.files);
            e.target.value = "";
          }}
        />

        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="group relative flex flex-col items-center justify-center p-8 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-indigo-200 hover:bg-slate-50/50 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
              <ImagePlus className="w-8 h-8 text-indigo-600" />
            </div>
            <span className="text-slate-900 font-bold">Gallery</span>
            <span className="text-slate-400 text-xs mt-1 font-medium">
              Upload photos
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              // Creating a temporary camera-only input
              const camInput = document.createElement("input");
              camInput.type = "file";
              camInput.accept = "image/*";
              camInput.capture = "environment";
              camInput.onchange = (e: Event) =>
                onFiles((e.target as HTMLInputElement).files);
              camInput.click();
            }}
            className="group relative flex flex-col items-center justify-center p-8 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-purple-200 hover:bg-slate-50/50 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
              <Camera className="w-8 h-8 text-purple-600" />
            </div>
            <span className="text-slate-900 font-bold">Camera</span>
            <span className="text-slate-400 text-xs mt-1 font-medium">
              Snap space
            </span>
          </button>
        </div>

        {/* Selected Photos Grid */}
        {photos.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center py-2">
            {photos.map((p, i) => (
              <div
                key={i}
                className="w-16 h-16 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden relative group animate-in fade-in zoom-in duration-300"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <img
                  src={URL.createObjectURL(p)}
                  className="w-full h-full object-cover"
                  alt=""
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPhotos(photos.filter((_, idx) => idx !== i));
                  }}
                  className="absolute inset-0 bg-slate-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-bold uppercase tracking-wider"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-4 pt-4">
          <Button
            size="lg"
            variant="primary"
            className="w-full h-16 text-lg font-bold shadow-xl shadow-indigo-500/10 group"
            onClick={() => {
              if (photos.length > 0) {
                navigate("/onboarding/loading");
              } else {
                navigate("/onboarding/text-scope");
              }
            }}
            type="button"
          >
            {photos.length
              ? `Analyze ${photos.length} Vision Assets`
              : "Skip for now (text focus)"}
            <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
          </Button>

          {photos.length > 0 && (
            <Button
              size="lg"
              variant="ghost"
              className="w-full text-slate-500 hover:text-indigo-600 font-medium h-12"
              onClick={() => {
                setPhotos([]);
                navigate("/onboarding/text-scope");
              }}
            >
              Clear and use text focus instead
            </Button>
          )}

          <p className="text-xs text-center text-slate-400 font-bold uppercase tracking-widest pt-2">
            Vision precision: +35% accuracy
          </p>
        </div>
      </div>
    </PageTransition>
  );
}
