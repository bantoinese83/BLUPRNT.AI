import { Users, Phone, Mail, ExternalLink, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { deriveHomeTeam } from "@shared/lib/home-team";
import type { InvoiceRow } from "@shared/types/database";
import { money } from "@/lib/formatters";

export function HomeTeamSection({
  invoices,
  isArchitect,
  hasProjectPass,
  onUpgradeClick,
}: {
  invoices: InvoiceRow[];
  isArchitect?: boolean;
  hasProjectPass?: boolean;
  onUpgradeClick?: () => void;
}) {
  const team = deriveHomeTeam(invoices);
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
          As you upload invoices, we’ll automatically build a directory of your
          property’s contractors.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
          The Home Team
        </h3>
        <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full ring-1 ring-teal-100">
          {team.length} Professionals
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {team.map((pro) => (
          <Card
            key={pro.name}
            className="border-slate-200/60 shadow-sm hover:shadow-md transition-all group"
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 font-black text-xs uppercase">
                    {pro.name.slice(0, 2)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      {pro.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">
                      Billed {money(pro.total_billed)} • Last active{" "}
                      {new Date(pro.last_activity).getFullYear()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
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
                  <div className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
