import { Users, Phone, Mail, Lock, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { money } from "@/lib/formatters";
import type { Contractor } from "@shared/lib/home-team";
import { DocumentThumbnail } from "@/components/dashboard/DocumentThumbnail";

export function HomeTeamSection({
  team,
  isArchitect,
  hasProjectPass,
  onUpgradeClick,
}: {
  team: Contractor[];
  isArchitect?: boolean;
  hasProjectPass?: boolean;
  onUpgradeClick?: () => void;
}) {
  const isUnlocked = isArchitect || hasProjectPass;

  if (team.length === 0) {
    return (
      <div className="p-8 text-center border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/30">
        <div className="w-12 h-12 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center mx-auto mb-4 text-slate-300">
          <Users className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-900 mb-1">
          Building your Team
        </h4>
        <p className="text-[11px] text-slate-500 font-medium max-w-[200px] mx-auto">
          As you upload ledger records, we’ll automatically build a directory of
          your property’s contractors.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-0.5">
      <div className="flex items-center justify-between px-2 pt-0.5">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
          The Home Team
        </h3>
        <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full ring-1 ring-teal-100">
          {team.length} Professionals
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 pt-0.5">
        {team.map((pro) => (
          <Card
            key={pro.name}
            className="border-slate-200/60 shadow-sm hover:shadow-md transition-all group overflow-visible"
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {pro.preview_ledger_entry_id ? (
                    <DocumentThumbnail
                      ledgerEntryId={pro.preview_ledger_entry_id}
                      size="sm"
                      className="shrink-0 rounded-xl border border-slate-100 shadow-sm"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100/80 flex items-center justify-center text-teal-600 font-black text-xs uppercase shrink-0">
                      {pro.name.slice(0, 2)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 text-sm leading-snug">
                      {pro.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight mt-0.5">
                      Billed {money(pro.total_billed)} • Last active{" "}
                      {new Date(pro.last_activity).getFullYear()}
                    </p>
                    {pro.documents_count > 0 ? (
                      <p className="text-[10px] font-semibold text-teal-700/90 mt-1.5 flex items-center gap-1.5">
                        <FileText
                          className="w-3.5 h-3.5 shrink-0"
                          aria-hidden
                        />
                        <span className="truncate normal-case tracking-normal">
                          {pro.documents_count} ledger file
                          {pro.documents_count === 1 ? "" : "s"}
                        </span>
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 opacity-85 hover:opacity-100 transition-opacity shrink-0">
                  {isUnlocked ? (
                    <>
                      {pro.contact_info.phone && (
                        <a
                          href={`tel:${pro.contact_info.phone}`}
                          className="p-2 hover:bg-teal-50 rounded-lg text-teal-600 transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                      {pro.contact_info.email && (
                        <a
                          href={`mailto:${pro.contact_info.email}`}
                          className="p-2 hover:bg-teal-50 rounded-lg text-teal-600 transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        onUpgradeClick?.();
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-teal-50 text-teal-700 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-teal-100 transition-colors"
                    >
                      <Lock className="w-3 h-3" />
                      Unlock Contact
                    </button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
