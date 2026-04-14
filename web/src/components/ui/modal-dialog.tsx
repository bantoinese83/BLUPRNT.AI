import {
  useRef,
  useCallback,
  type ReactNode,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { cn } from "@/lib/utils";

export type ModalDialogMotion = "dialog" | "command";

export type ModalDialogProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Visible title element id for `aria-labelledby`. */
  titleId?: string;
  /** Used when there is no visible title id. */
  ariaLabel?: string;
  descriptionId?: string;
  className?: string;
  overlayClassName?: string;
  panelClassName?: string;
  zClassName?: string;
  align?: "center" | "start";
  /** Extra vertical offset when `align="start"` (e.g. command palette). */
  alignOffsetClassName?: string;
  paddingClassName?: string;
  /** Click backdrop to dismiss (default true). */
  overlayDismiss?: boolean;
  motionPreset?: ModalDialogMotion;
};

export function ModalDialog({
  open,
  onClose,
  children,
  titleId,
  ariaLabel,
  descriptionId,
  className,
  overlayClassName = "bg-slate-900/40 backdrop-blur-sm",
  panelClassName,
  zClassName = "z-[100]",
  align = "center",
  alignOffsetClassName = "pt-[15vh]",
  paddingClassName = "p-4 sm:p-6",
  overlayDismiss = true,
  motionPreset = "dialog",
}: ModalDialogProps) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(open, ref);

  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    },
    [onClose],
  );

  const panelMotion =
    motionPreset === "command"
      ? {
          initial: { scale: 0.95, opacity: 0, y: -20 },
          animate: { scale: 1, opacity: 1, y: 0 },
          exit: { scale: 0.95, opacity: 0, y: -20 },
          transition: { type: "spring" as const, damping: 25, stiffness: 300 },
        }
      : {
          initial: { opacity: 0, scale: 0.95, y: 20 },
          animate: { opacity: 1, scale: 1, y: 0 },
          exit: { opacity: 0, scale: 0.95, y: 20 },
        };

  const labelledBy = titleId ?? undefined;
  const label = !titleId ? (ariaLabel ?? "Dialog") : undefined;

  return (
    <AnimatePresence>
      {open && (
        <div
          ref={ref}
          className={cn(
            "fixed inset-0 flex",
            zClassName,
            align === "center"
              ? "items-center justify-center"
              : cn("items-start justify-center", alignOffsetClassName),
            paddingClassName,
            className,
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
          aria-label={label}
          aria-describedby={descriptionId}
          onKeyDown={onKeyDown}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn("absolute inset-0", overlayClassName)}
            onClick={overlayDismiss ? onClose : undefined}
            aria-hidden="true"
          />

          <motion.div
            {...panelMotion}
            className={cn("relative", panelClassName)}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export type ModalFocusSurfaceProps = {
  children: ReactNode;
  className?: string;
  titleId?: string;
  ariaLabel?: string;
  descriptionId?: string;
  onEscape: () => void;
  /** When false, Escape does not close and focus is not trapped (e.g. nested preview). */
  active?: boolean;
};

/**
 * Non-animated modal shell with the same focus-trap and dialog semantics as
 * {@link ModalDialog}, for loading states or layouts that do not use motion.
 */
export function ModalFocusSurface({
  children,
  className,
  titleId,
  ariaLabel,
  descriptionId,
  onEscape,
  active = true,
}: ModalFocusSurfaceProps) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(active, ref);

  return (
    <div
      ref={ref}
      className={className}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-label={titleId ? undefined : ariaLabel}
      aria-describedby={descriptionId}
      onKeyDown={(e) => {
        if (!active) return;
        if (e.key === "Escape") onEscape();
      }}
    >
      {children}
    </div>
  );
}
