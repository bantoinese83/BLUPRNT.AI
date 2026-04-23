import {
  BarChart3,
  Shield,
  Landmark,
  TrendingUp,
  Users,
  MoveHorizontal,
  Clock,
} from "lucide-react";
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
        <p className="mx-auto mt-3 max-w-xl text-center text-slate-800">
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
              <p className="mt-1 text-sm text-slate-800">
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
              <p className="mt-1 text-sm text-slate-800">
                Your to-do list, checks you wrote, and files—together, not
                scattered across apps.
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
              <p className="mt-1 text-sm text-slate-800">
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
              <p className="mt-1 text-sm text-slate-800">
                Watch planned vs. actual spend so surprises don’t arrive in a
                lump at the end.
              </p>
            </div>
          </li>

          {/* New Row */}
          <li className="flex items-start gap-4">
            <Users className="h-6 w-6 shrink-0 text-slate-900" aria-hidden />
            <div>
              <h3 className="font-semibold text-slate-900">
                Automatic Home Team
              </h3>
              <p className="mt-1 text-sm text-slate-800">
                AI extracts pro names from your receipts to build a verified
                directory of everyone who’s worked on your home.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <MoveHorizontal
              className="h-6 w-6 shrink-0 text-slate-900"
              aria-hidden
            />
            <div>
              <h3 className="font-semibold text-slate-900">Visual Proof</h3>
              <p className="mt-1 text-sm text-slate-800">
                Swipe between your "Before" and "Now" photos to see the
                transformation and prove the value you've added.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <Clock className="h-6 w-6 shrink-0 text-slate-900" aria-hidden />
            <div>
              <h3 className="font-semibold text-slate-900">
                Warranty Tracking
              </h3>
              <p className="mt-1 text-sm text-slate-800">
                Never lose a warranty again. We track expiration dates for your
                systems and appliances in your permanent record.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-4 opacity-40 grayscale group cursor-help">
            <Shield className="h-6 w-6 shrink-0 text-slate-900" aria-hidden />
            <div>
              <h3 className="font-semibold text-slate-900">Private Vault</h3>
              <p className="mt-1 text-sm text-slate-800 italic">
                Securely store paint lids, tile box codes, and finish details.
                Coming soon.
              </p>
            </div>
          </li>
        </ul>
      </div>
    </section>
  );
}
