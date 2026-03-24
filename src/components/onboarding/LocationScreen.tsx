import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  MapPin,
  HelpCircle,
  LocateFixed,
  Loader2,
  Radar,
  SkipForward,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageTransition } from "./PageTransition";
import { useOnboarding } from "@/hooks/use-onboarding";
import {
  suggestLocationFromNetwork,
  suggestLocationFromDeviceGps,
  userFacingLocationError,
} from "@/lib/location";

const SESSION_IP_KEY = "bluprnt_location_ip_attempted";

export function LocationScreen() {
  const navigate = useNavigate();
  const { locationInput, setLocationInput, setLocationUnset } = useOnboarding();
  const [showWhy, setShowWhy] = useState(false);
  /** How the field was last filled automatically */
  const [autoSource, setAutoSource] = useState<"ip" | "gps" | null>(null);
  const [ipLoading, setIpLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const manualEditRef = useRef(false);
  const locationRef = useRef(locationInput);
  locationRef.current = locationInput;

  const onInputChange = useCallback(
    (value: string) => {
      manualEditRef.current = true;
      setAutoSource(null);
      setHint(null);
      setLocationInput(value);
    },
    [setLocationInput],
  );

  useEffect(() => {
    if (typeof sessionStorage === "undefined") return;
    if (sessionStorage.getItem(SESSION_IP_KEY)) return;
    if (locationRef.current.trim()) return;

    sessionStorage.setItem(SESSION_IP_KEY, "1");
    let cancelled = false;
    setIpLoading(true);
    setHint(null);

    suggestLocationFromNetwork()
      .then((label) => {
        if (cancelled || !label) return;
        if (locationRef.current.trim()) return;
        setLocationInput(label);
        setAutoSource("ip");
        setHint(
          "Filled from your general area. Use precise location or edit if this isn’t right.",
        );
      })
      .finally(() => {
        if (!cancelled) setIpLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [setLocationInput]);

  async function usePreciseLocation() {
    setHint(null);
    setGpsLoading(true);
    try {
      const label = await suggestLocationFromDeviceGps({ timeoutMs: 20000 });
      if (label) {
        manualEditRef.current = false;
        setLocationInput(label);
        setAutoSource("gps");
        setHint("Updated using your device location. You can still edit the field.");
      } else {
        setHint("We couldn’t resolve an address. Try a ZIP or intersection.");
      }
    } catch (e) {
      const code = e instanceof Error ? e.message : "unknown";
      setHint(userFacingLocationError(code));
    } finally {
      setGpsLoading(false);
    }
  }

  return (
    <PageTransition>
      <div className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Where is this home?
          </h2>
          <p className="text-slate-500">
            We use your area to ground costs in real numbers, not guesses.
          </p>
        </div>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 justify-center gap-2 border-slate-200 bg-white text-slate-900 hover:bg-slate-50"

              onClick={usePreciseLocation}
              disabled={gpsLoading}
            >
              {gpsLoading ? (
                <Loader2 className="w-5 h-5 animate-spin shrink-0" aria-hidden />
              ) : (
                <LocateFixed className="w-5 h-5 shrink-0" aria-hidden />
              )}
              {gpsLoading ? "Finding your location…" : "Use precise location"}
            </Button>
            <p className="text-xs text-center text-slate-500">
              Or type below — ZIP works best for estimates.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              ZIP code or nearest intersection
            </label>
            <div className="relative">
              {ipLoading && !locationInput.trim() ? (
                <Loader2 className="absolute left-3 top-3.5 h-4 w-4 text-slate-900 animate-spin" aria-hidden />

              ) : (
                <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" aria-hidden />
              )}
              <Input
                className="pl-9 h-12"
                placeholder="e.g. 90210 or Main & Oak"
                value={locationInput}
                onChange={(e) => onInputChange(e.target.value)}
                autoComplete="postal-code"
                inputMode="text"
              />
            </div>
            <p className="text-xs text-slate-500">
              You can skip the exact house number.
            </p>
            {autoSource && (
              <p className="text-xs text-slate-700 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 flex items-start gap-2">

                {autoSource === "ip" ? (
                  <Radar className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
                ) : (
                  <LocateFixed className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
                )}
                <span>{hint}</span>
              </p>
            )}
            {hint && !autoSource && (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                {hint}
              </p>
            )}
          </div>
          <div className="relative">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-sm text-slate-900 font-bold hover:underline"

              onClick={() => setShowWhy((v) => !v)}
              aria-expanded={showWhy}
            >
              <HelpCircle className="w-4 h-4 shrink-0" />
              Why we ask this
            </button>
            {showWhy && (
              <div
                className="mt-2 p-3 bg-slate-900 text-white text-sm rounded-xl shadow-lg"
                role="tooltip"
              >
                Labor and material costs change a lot by location. This helps us stay within about 15% of real quotes.
              </div>
            )}
          </div>
        </div>
        <div className="space-y-3">
          <Button
            size="lg"
            variant="primary"
            className="w-full"
            onClick={() => {
              if (!locationInput.trim()) {
                toast.error("Please enter a ZIP code, or click 'Skip for now'.");
                return;
              }
              setLocationUnset(false);
              navigate("/onboarding/stage");
            }}
            type="button"
          >
            Continue
            <ArrowRight className="w-5 h-5 shrink-0" aria-hidden />
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="w-full text-slate-500"
            onClick={() => {
              setLocationInput("");
              setLocationUnset(true);
              navigate("/onboarding/stage");
            }}
            type="button"
          >
            <SkipForward className="w-5 h-5 shrink-0" aria-hidden />
            Skip for now (less accurate estimates)
          </Button>
        </div>
      </div>
    </PageTransition>
  );
}
