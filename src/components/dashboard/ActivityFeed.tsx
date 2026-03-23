import { motion } from "motion/react";
import { 
  Upload, 
  CheckCircle2, 
  History, 
  ArrowUpRight,
  PlusCircle,
  LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Highlighter } from "@/components/ui/Highlighter";

// For now we'll use a mocked structure that could be easily wired to a DB table
export type ActivityEvent = {
  id: string;
  type: "upload" | "status_change" | "project_created" | "goal_reached";
  title: string;
  description: string;
  timestamp: string;
  link?: string;
};

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

const COLOR_MAP: Record<ActivityEvent["type"], string> = {
  upload: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  status_change: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  project_created: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  goal_reached: "text-purple-400 bg-purple-500/10 border-purple-500/20",
};

export function ActivityFeed({ events, className }: ActivityFeedProps) {
  if (events.length === 0) return null;

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between px-2">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
          <Highlighter action="underline" color="#6366f1" strokeWidth={2} padding={0}>
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
          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative flex gap-4 group"
            >
              <div className={cn(
                "relative z-10 w-11 h-11 rounded-2xl border flex items-center justify-center transition-transform group-hover:scale-110 duration-300",
                COLOR_MAP[event.type]
              )}>
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex-1 pt-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-slate-950 transition-colors">
                    {event.title}
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400 tabular-nums uppercase tracking-wider">
                    {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
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
