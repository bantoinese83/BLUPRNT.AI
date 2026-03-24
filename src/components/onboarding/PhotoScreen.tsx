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
    
    const validFiles = Array.from(files).filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`"${file.name}" is too large. Max 10MB per photo.`);
        return false;
      }
      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        toast.error(`"${file.name}" is not a supported format (JPEG, PNG, WEBP).`);
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
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Show us the space
          </h2>
          <p className="text-slate-500">
            Snap 1–3 photos so we can auto-detect fixtures and size the job.
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            onFiles(e.target.files);
            e.target.value = "";
          }}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-slate-300 rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-4 bg-white hover:border-slate-400 hover:bg-slate-50 transition-colors"
        >

          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
            {photos.length ? (
              <ImagePlus className="w-8 h-8 text-slate-900" aria-hidden />

            ) : (
              <Camera className="w-8 h-8 text-slate-400" aria-hidden />
            )}
          </div>
          <div className="text-sm text-slate-600">
            {photos.length
              ? `${photos.length} photo${photos.length === 1 ? "" : "s"} selected — tap to add more`
              : "Tap to upload photos of your space"}
          </div>
        </button>

        <div className="space-y-3">
          <Button
            size="lg"
            variant="primary"
            className="w-full"
            onClick={() => navigate("/onboarding/loading")}
            type="button"
          >
            {photos.length ? "Continue with photos" : "Add photos"}
            <ArrowRight className="w-5 h-5 shrink-0" aria-hidden />
          </Button>
          <p className="text-xs text-center text-slate-500">
            Photos make estimates about 30% more accurate in your area.
          </p>
          <Button
            size="lg"
            variant="ghost"
            className="w-full text-slate-500"
            onClick={() => {
              setPhotos([]);
              navigate("/onboarding/text-scope");
            }}
          >
            Skip for now (text only)
          </Button>
        </div>
      </div>
    </PageTransition>
  );
}
