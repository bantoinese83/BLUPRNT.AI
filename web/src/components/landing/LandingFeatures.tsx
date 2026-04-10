import { BarChart3, Shield, Landmark, TrendingUp } from "lucide-react";
import { Highlighter } from "@/components/ui/Highlighter";
import {
  LANDING_HIGHLIGHT_SOFT,
  LANDING_HIGHLIGHT_UNDERLINE,
} from "./landing-content";

export function LandingFeatures() {
  return (
    <section
      id="features"
      className="border-t border-slate-200/80 bg-slate-50/50 px-4 py-20 sm:px-6 scroll-mt-24 sm:scroll-mt-28"
      aria-labelledby="features-heading"
    >
      <div className="mx-auto max-w-6xl">
        <h2
          id="features-heading"
          className="text-center text-2xl font-bold text-slate-900 sm:text-3xl"
        >
          Built for homeowners
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-slate-600">
          <Highlighter
            action="underline"
            color={LANDING_HIGHLIGHT_UNDERLINE}
            strokeWidth={2}
            padding={0}
            iterations={1}
            isView={true}
          >
            Not contractors.
          </Highlighter>{" "}
          You - planning, selling, or improving.
        </p>
        <ul
          className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
          role="list"
        >
          <li className="flex items-start gap-4">
            <BarChart3
              className="h-6 w-6 shrink-0 text-slate-900"
              aria-hidden
            />
            <div>
              <h3 className="font-semibold text-slate-900">
                Room photos → rough budget
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Point the camera, get a starter range and what’s in the job—no
                spreadsheet required.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <Landmark className="h-6 w-6 shrink-0 text-slate-900" aria-hidden />
            <div>
              <h3 className="font-semibold text-slate-900">
                Share-ready detail
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Your to-do list, checks you wrote, and files—together, not
                scattered across apps. They still make the final call.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <Shield className="h-6 w-6 shrink-0 text-slate-900" aria-hidden />
            <div>
              <h3 className="font-semibold text-slate-900">
                <Highlighter
                  action="highlight"
                  color={LANDING_HIGHLIGHT_SOFT}
                  padding={2}
                  isView={true}
                >
                  Seller packet
                </Highlighter>
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Summarize improvements and documented spend in one export—not a
                valuation or guarantee.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <TrendingUp
              className="h-6 w-6 shrink-0 text-slate-900"
              aria-hidden
            />
            <div>
              <h3 className="font-semibold text-slate-900">
                Where did the money go?
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Watch planned vs. actual spend so surprises don’t arrive in a
                lump at the end.
              </p>
            </div>
          </li>
        </ul>
      </div>
    </section>
  );
}
