import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Highlighter } from "@/components/ui/Highlighter";
import { LANDING_HIGHLIGHT_COLOR } from "./landing-content";

export function LandingFinalCta() {
  return (
    <section
      className="border-t border-slate-200/80 bg-white px-4 py-24 sm:px-6"
      aria-labelledby="cta-heading"
    >
      <div className="mx-auto max-w-3xl text-center">
        <h2
          id="cta-heading"
          className="text-2xl font-bold text-slate-900 sm:text-3xl"
        >
          <Highlighter
            action="highlight"
            color={LANDING_HIGHLIGHT_COLOR}
            padding={4}
            iterations={1}
            isView={true}
          >
            Ready to start?
          </Highlighter>
        </h2>
        <p className="mt-4 text-slate-600">
          Get your first estimate in{" "}
          <Highlighter
            action="underline"
            color="#6366f1"
            strokeWidth={2}
            padding={0}
            iterations={1}
            isView={true}
          >
            under a minute
          </Highlighter>
          . No credit card required.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link to="/onboarding">
            <Button size="lg" variant="primary" className="h-12 px-8 text-base">
              Get my first estimate
              <ArrowRight className="ml-2 h-5 w-5" aria-hidden />
            </Button>
          </Link>
          <Link to="/login">
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 text-base border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Sign in
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
