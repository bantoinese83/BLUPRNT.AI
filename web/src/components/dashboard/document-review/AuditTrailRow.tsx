import { Sparkles, ShieldCheck, Clock } from "lucide-react";

import { formatShortUsDate } from "@shared/lib/formatters";

interface AuditTrailRowProps {
  isVerified?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

function relativeFromIso(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  const diffMs = Date.now() - t;
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatShortUsDate(iso);
}

/**
 * Compact "audit trail" strip for the document review modal.
 * Shows verification state and when the entry was created / last touched.
 */
export function AuditTrailRow({
  isVerified,
  createdAt,
  updatedAt,
}: AuditTrailRowProps) {
  const updated = relativeFromIso(updatedAt);
  const created = relativeFromIso(createdAt);
  const showUpdated = updated && (!createdAt || createdAt !== updatedAt);

  if (!created && !updated && isVerified == null) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
      {isVerified === true ? (
        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
          <ShieldCheck className="w-3 h-3" aria-hidden />
          Verified
        </span>
      ) : isVerified === false ? (
        <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
          <Sparkles className="w-3 h-3" aria-hidden />
          AI draft — needs review
        </span>
      ) : null}
      {created ? (
        <span className="inline-flex items-center gap-1">
          <Clock className="w-3 h-3" aria-hidden />
          Added {created}
        </span>
      ) : null}
      {showUpdated ? <span>· Updated {updated}</span> : null}
    </div>
  );
}
