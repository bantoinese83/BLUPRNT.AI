import { BarChart3, Receipt, Shield, Home } from "lucide-react";
import { Highlighter } from "@/components/ui/Highlighter";

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
            color="#6366f1"
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
                Photo-to-estimate
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Snap photos, get a grounded cost range in seconds.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <Receipt className="h-6 w-6 shrink-0 text-slate-900" aria-hidden />
            <div>
              <h3 className="font-semibold text-slate-900">Invoice tracking</h3>
              <p className="mt-1 text-sm text-slate-600">
                Upload receipts and quotes — we keep them organized.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <Shield className="h-6 w-6 shrink-0 text-slate-900" aria-hidden />
            <div>
              <h3 className="font-semibold text-slate-900">
                <Highlighter
                  action="highlight"
                  color="#ffd1dc"
                  padding={2}
                  isView={true}
                >
                  Seller packet
                </Highlighter>
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Document your improvements for buyers and agents.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <Home className="h-6 w-6 shrink-0 text-slate-900" aria-hidden />
            <div>
              <h3 className="font-semibold text-slate-900">Property record</h3>
              <p className="mt-1 text-sm text-slate-600">
                Your home’s financial twin — from idea to sale.
              </p>
            </div>
          </li>
        </ul>
      </div>
    </section>
  );
}
