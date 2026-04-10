import { cn } from "@/lib/utils";

type ImgProps = {
  className?: string;
  /** Accessible label; omit when decorative (parent supplies context). */
  title?: string;
};

/** Monthly Architect subscription — `public/architect.svg` */
export function ArchitectPlanIcon({ className, title }: ImgProps) {
  return (
    <img
      src="/architect.svg"
      alt={title ?? ""}
      role={title ? "img" : "presentation"}
      className={cn("h-7 w-7 shrink-0 object-contain", className)}
      loading="lazy"
      decoding="async"
    />
  );
}

/** Project Pass (one-time) — `public/project.svg` */
export function ProjectPassIcon({ className, title }: ImgProps) {
  return (
    <img
      src="/project.svg"
      alt={title ?? ""}
      role={title ? "img" : "presentation"}
      className={cn("h-7 w-7 shrink-0 object-contain", className)}
      loading="lazy"
      decoding="async"
    />
  );
}
