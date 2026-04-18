import { Helmet } from "react-helmet-async";
import { Settings2 } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { AppSlimFooter } from "@/components/layout/AppSlimFooter";
import { Button } from "@/components/ui/button";
import { META_ROBOTS_NOINDEX } from "@/lib/seo-meta";
import { DASHBOARD_EMPTY_STATE } from "@shared/copy/dashboard";

export function DashboardSupabaseNotConfiguredView() {
  return (
    <>
      <Helmet>
        <title>Can&apos;t connect — BLUPRNT.AI</title>
        <meta name="robots" content={META_ROBOTS_NOINDEX} />
      </Helmet>
      <div className="flex min-h-screen flex-col bg-slate-50">
        <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-amber-100 bg-amber-50 shadow-sm">
            <Settings2 className="h-10 w-10 text-amber-500" aria-hidden />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              Can&apos;t connect right now
            </h2>
            <p className="text-sm font-medium leading-relaxed text-slate-500">
              We couldn&apos;t reach BLUPRNT. Check your connection, try again,
              or contact support if this keeps happening.
            </p>
            {import.meta.env.DEV ? (
              <p className="text-xs font-medium leading-relaxed text-slate-400">
                This usually means environment variables aren&apos;t set for
                this deployment, or something is blocking the connection.
              </p>
            ) : null}
          </div>
          {import.meta.env.DEV && (
            <div className="w-full space-y-2 rounded-2xl border border-slate-200 bg-slate-100 p-4 text-left font-mono text-[10px]">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                Developer
              </p>
              <p className="truncate text-slate-600">VITE_SUPABASE_URL</p>
              <p className="truncate text-slate-600">VITE_SUPABASE_ANON_KEY</p>
            </div>
          )}
          <Button
            variant="outline"
            className="rounded-xl border-slate-200"
            onClick={() => window.location.reload()}
          >
            Try again
          </Button>
        </div>
        <AppSlimFooter className="bg-white/60" />
      </div>
    </>
  );
}

export function DashboardLoadingView() {
  return (
    <>
      <Helmet>
        <title>Loading dashboard — BLUPRNT.AI</title>
        <meta name="robots" content={META_ROBOTS_NOINDEX} />
      </Helmet>
      <DashboardSkeleton />
      <AppSlimFooter className="border-slate-200/70 bg-white/50" />
    </>
  );
}

export function DashboardFatalLoadErrorView({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <>
      <Helmet>
        <title>Couldn&apos;t load dashboard — BLUPRNT.AI</title>
        <meta name="robots" content={META_ROBOTS_NOINDEX} />
      </Helmet>
      <div className="flex min-h-screen flex-col bg-slate-50">
        <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-amber-100 bg-amber-50">
            <Settings2 className="h-10 w-10 text-amber-600" aria-hidden />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Something went wrong
            </h2>
            <p className="text-sm leading-relaxed text-slate-600">{message}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              className="rounded-xl"
              onClick={() => {
                void onRetry();
              }}
            >
              Try again
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-slate-200"
              onClick={() => window.location.assign("/")}
            >
              Back to home
            </Button>
          </div>
        </div>
        <AppSlimFooter className="bg-white/60" />
      </div>
    </>
  );
}

export function DashboardNoProjectView() {
  return (
    <>
      <Helmet>
        <title>Get started — BLUPRNT.AI</title>
        <meta name="robots" content={META_ROBOTS_NOINDEX} />
      </Helmet>
      <div className="flex min-h-screen flex-col bg-slate-50">
        <div className="flex flex-1 flex-col items-center justify-center p-6">
          <EmptyState
            variant="projects"
            currentStep={1}
            title={DASHBOARD_EMPTY_STATE.title}
            description={DASHBOARD_EMPTY_STATE.description}
            action={{
              label: DASHBOARD_EMPTY_STATE.primaryCta,
              onClick: () => {
                window.location.href = "/onboarding/type";
              },
            }}
            secondaryAction={{
              label: DASHBOARD_EMPTY_STATE.secondaryCta,
              onClick: () => {
                window.location.href = "/onboarding";
              },
            }}
            className="w-full max-w-md"
          />
        </div>
        <AppSlimFooter className="bg-white/60" />
      </div>
    </>
  );
}
