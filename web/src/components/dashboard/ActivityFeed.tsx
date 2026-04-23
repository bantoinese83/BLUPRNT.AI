import { motion } from "motion/react";
import {
  Upload,
  CheckCircle2,
  History,
  ArrowUpRight,
  PlusCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Highlighter } from "@/components/ui/Highlighter";
import type { ActivityEvent } from "@/lib/activity";
import { BLUPRNT_COLORS } from "@shared/constants/design-tokens";

export type { ActivityEvent };

function withRgbAlpha(hex: string, alpha: number) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return `rgba(0,0,0,${alpha})`;
  return `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${alpha})`;
}

interface ActivityFeedProps {
  events: ActivityEvent[];
  className?: string;
}

const ICON_MAP: Record<ActivityEvent["type"], LucideIcon> = {
  upload: Upload,
  status_change: History,
  project_created: PlusCircle,
  goal_reached: CheckCircle2,
};

/** Accent per activity type (ties to BLUPRNT palette where possible). */
const EVENT_ACCENT: Record<ActivityEvent["type"], string> = {
  upload: BLUPRNT_COLORS.info,
  status_change: "#fbbf24",
  project_created: "#34d399",
  goal_reached: "#a78bfa",
};

export function ActivityFeed({ events, className }: ActivityFeedProps) {
  if (events.length === 0) return null;

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between px-2">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
          <Highlighter
            action="underline"
            color={BLUPRNT_COLORS.accentLight}
            strokeWidth={2}
            padding={0}
            isView={true}
            delay={0.6}
          >
            Latest Activity
          </Highlighter>
        </h3>
        <div className="h-px flex-1 bg-slate-200/50 mx-4" />
      </div>

      <div className="relative space-y-4">
        {/* The Vertical Line */}
        <div className="absolute left-[21px] top-2 bottom-2 w-px bg-gradient-to-b from-slate-200 via-slate-200 to-transparent" />

        {events.map((event, idx) => {
          const Icon = ICON_MAP[event.type];
          const accent = EVENT_ACCENT[event.type];
          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative flex gap-4 group"
            >
              <div
                className={cn(
                  "relative z-10 w-11 h-11 rounded-2xl border flex items-center justify-center transition-transform group-hover:scale-110 duration-300",
                )}
                style={{
                  color: accent,
                  backgroundColor: withRgbAlpha(accent, 0.1),
                  borderColor: withRgbAlpha(accent, 0.2),
                }}
              >
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex-1 pt-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-slate-950 transition-colors">
                    {event.title}
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400 tabular-nums uppercase tracking-wider">
                    {formatDistanceToNow(new Date(event.timestamp), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-sm">
                  {event.description}
                </p>

                {event.link && (
                  <a
                    href={event.link}
                    className="inline-flex items-center gap-1 text-[10px] font-black text-slate-900 uppercase tracking-widest hover:gap-2 transition-all group/link mt-2"
                  >
                    View Details
                    <ArrowUpRight className="w-3 h-3 transition-transform group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5" />
                  </a>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
