import { useMemo, useState } from "react";
import { CalendarClock, Shield, FileWarning, BadgeCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatShortUsDate } from "@shared/lib/formatters";
import type { LedgerEntryRow } from "@shared/types/database";
import {
  collectUpcomingRenewals,
  renewalRelativeLabel,
  summarizeRenewals,
  type RenewalKind,
  type UpcomingRenewal,
} from "@shared/lib/upcoming-renewals";
import { DocumentReviewModal } from "@/components/dashboard/DocumentReviewModal";

const KIND_ICON: Record<RenewalKind, typeof Shield> = {
  warranty: BadgeCheck,
  insurance: Shield,
  permit: FileWarning,
};

const URGENCY_STYLES: Record<
  UpcomingRenewal["urgency"],
  { pill: string; text: string; label: string }
> = {
  expired: {
    pill: "bg-rose-50 text-rose-700 ring-rose-100",
    text: "text-rose-700",
    label: "Expired",
  },
  soon: {
    pill: "bg-amber-50 text-amber-700 ring-amber-100",
    text: "text-amber-700",
    label: "≤ 30d",
  },
  upcoming: {
    pill: "bg-teal-50 text-teal-700 ring-teal-100",
    text: "text-teal-700",
    label: "≤ 90d",
  },
  future: {
    pill: "bg-slate-50 text-slate-600 ring-slate-200",
    text: "text-slate-600",
    label: "Tracked",
  },
};

interface UpcomingRenewalsCardProps {
  projectId: string;
  ledgerEntries: readonly LedgerEntryRow[];
  /** Cap rows shown in the card. Default 5. */
  limit?: number;
  /** Refetch the dashboard when a row is saved/deleted in the modal. */
  onChanged?: () => void;
}

export function UpcomingRenewalsCard({
  projectId,
  ledgerEntries,
  limit = 5,
  onChanged,
}: UpcomingRenewalsCardProps) {
  const allItems = useMemo(
    () => collectUpcomingRenewals(ledgerEntries, { maxDaysAhead: 365 * 5 }),
    [ledgerEntries],
  );
  const summary = useMemo(() => summarizeRenewals(allItems), [allItems]);
  const visible = allItems.slice(0, limit);
  const hiddenCount = Math.max(0, allItems.length - visible.length);

  const [openId, setOpenId] = useState<string | null>(null);

  if (allItems.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="border-slate-200/80 shadow-drop-sm overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-slate-500" aria-hidden />
                Upcoming renewals & expirations
              </CardTitle>
              <p className="text-xs text-slate-500 leading-snug">
                Warranties, insurance and permits we're tracking for this home.
              </p>
            </div>
            {summary.expired + summary.soon > 0 ? (
              <Badge
                variant="secondary"
                className={cn(
                  "shrink-0 text-[10px] font-black tracking-widest",
                  summary.expired > 0
                    ? "bg-rose-100 text-rose-800"
                    : "bg-amber-100 text-amber-800",
                )}
              >
                {summary.expired > 0
                  ? `${summary.expired} expired`
                  : `${summary.soon} due soon`}
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <ul className="divide-y divide-slate-100">
            {visible.map((item) => {
              const Icon = KIND_ICON[item.kind];
              const style = URGENCY_STYLES[item.urgency];
              const buttonLabel = `${item.label}${
                item.vendorName ? ` · ${item.vendorName}` : ""
              } — ${renewalRelativeLabel(item.daysUntil)}`;
              return (
                <li key={`${item.ledgerEntryId}-${item.kind}`}>
                  <button
                    type="button"
                    onClick={() => setOpenId(item.ledgerEntryId)}
                    className="group w-full flex items-center gap-3 py-2.5 text-left rounded-lg px-1.5 -mx-1.5 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 transition-colors"
                    aria-label={`Open ${buttonLabel}`}
                  >
                    <span
                      className={cn(
                        "shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ring-1",
                        style.pill,
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-slate-900 truncate">
                          {item.vendorName?.trim() || `${item.label} record`}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 shrink-0">
                          {item.label}
                        </span>
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        {formatShortUsDate(item.dueDate)}{" "}
                        <span className={cn("font-medium", style.text)}>
                          · {renewalRelativeLabel(item.daysUntil)}
                        </span>
                      </span>
                    </span>
                    <span
                      className={cn(
                        "shrink-0 text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ring-1",
                        style.pill,
                      )}
                    >
                      {style.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {hiddenCount > 0 ? (
            <p className="pt-2 text-[11px] text-slate-500">
              +{hiddenCount} more tracked further out
            </p>
          ) : null}
        </CardContent>
      </Card>

      {openId ? (
        <DocumentReviewModal
          documentId={openId}
          projectId={projectId}
          onClose={() => setOpenId(null)}
          onSaved={() => {
            setOpenId(null);
            onChanged?.();
          }}
          onDeleted={() => {
            setOpenId(null);
            onChanged?.();
          }}
        />
      ) : null}
    </>
  );
}
