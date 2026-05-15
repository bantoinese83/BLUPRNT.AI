import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { LedgerDocumentFilter } from "@/lib/plan-vs-actual";

type DocumentFiltersProps = {
  ledgerFilter: LedgerDocumentFilter;
  setLedgerFilter: (filter: LedgerDocumentFilter) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
};

export function DocumentFilters({
  ledgerFilter,
  setLedgerFilter,
  searchQuery,
  setSearchQuery,
}: DocumentFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 backdrop-blur-sm rounded-xl border border-slate-200/40 w-full sm:w-auto">
        {(["all", "billed", "unbilled"] as LedgerDocumentFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setLedgerFilter(f)}
            className={cn(
              "px-3.5 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg",
              ledgerFilter === f
                ? "bg-white text-teal-600 shadow-sm ring-1 ring-slate-200/60"
                : "text-slate-400 hover:text-slate-600",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="relative w-full sm:w-64 group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
        <Input
          id="document-search-input"
          placeholder="Search records... (/)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-10 bg-white border-slate-200 rounded-xl text-xs font-medium placeholder:text-slate-400 focus-visible:ring-teal-500/20 focus-visible:border-teal-500 transition-all shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-md text-slate-400 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
