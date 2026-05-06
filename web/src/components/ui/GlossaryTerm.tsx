import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HelpCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { getGlossaryEntry } from "@shared/lib/glossary";

interface GlossaryTermProps {
  /** Entry id (preferred) or term/alias text. */
  termId: string;
  /** Optional override for the visible label. Defaults to the entry's `term`. */
  children?: ReactNode;
  className?: string;
}

/**
 * Inline glossary tooltip. Click or focus to open; Esc / outside-click to close.
 * Falls back to plain text if the term is unknown so callers don't need to guard.
 */
export function GlossaryTerm({
  termId,
  children,
  className,
}: GlossaryTermProps) {
  const entry = getGlossaryEntry(termId);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement | null>(null);
  const popoverId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!entry) return <>{children ?? termId}</>;

  const label = children ?? entry.term;

  return (
    <span ref={wrapRef} className={cn("relative inline-block", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={popoverId}
        aria-label={`What is ${entry.term}?`}
        className="inline-flex items-center gap-0.5 text-[inherit] underline decoration-dotted decoration-slate-400 underline-offset-2 hover:decoration-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 rounded-sm"
      >
        <span>{label}</span>
        <HelpCircle
          className="w-3 h-3 text-slate-400 group-hover:text-slate-600"
          aria-hidden
        />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.span
            id={popoverId}
            role="tooltip"
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="absolute z-50 left-0 top-full mt-1.5 w-64 max-w-[80vw] rounded-xl border border-slate-200 bg-white p-3 text-left shadow-xl"
          >
            <span className="block text-[11px] font-black uppercase tracking-widest text-slate-500">
              {entry.term}
            </span>
            <span className="mt-1 block text-xs leading-snug text-slate-700">
              {entry.short}
            </span>
            {entry.long ? (
              <span className="mt-1.5 block text-[11px] leading-snug text-slate-500">
                {entry.long}
              </span>
            ) : null}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </span>
  );
}
