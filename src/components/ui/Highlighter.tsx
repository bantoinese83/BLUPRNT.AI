"use client";

import { useEffect, useMemo, useRef } from "react";
import type React from "react";
import { useInView } from "motion/react";
import { annotate } from "rough-notation";
import { type RoughAnnotation } from "rough-notation/lib/model";

type AnnotationAction =
  | "highlight"
  | "underline"
  | "box"
  | "circle"
  | "strike-through"
  | "crossed-off"
  | "bracket";

interface HighlighterProps {
  children: React.ReactNode;
  action?: AnnotationAction;
  color?: string;
  strokeWidth?: number;
  animationDuration?: number;
  iterations?: number;
  padding?: number;
  multiline?: boolean;
  isView?: boolean;
  delay?: number;
}

export function Highlighter({
  children,
  action = "highlight",
  color = "#ffd1dc",
  strokeWidth = 1.5,
  animationDuration = 600,
  iterations = 2,
  padding = 2,
  multiline = true,
  isView = false,
  delay = 0,
}: HighlighterProps) {
  const elementRef = useRef<HTMLSpanElement>(null);
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isInView = useInView(elementRef, {
    once: true,
    margin: "0px",
  });

  // If isView is false, always show. If isView is true, wait for inView
  const shouldShow = !isView || isInView;

  const inlineClassName = useMemo(() => {
    // Box/circle/bracket-based annotations are more reliable on inline-block.
    if (action === "box" || action === "circle" || action === "bracket") {
      return "relative inline-block bg-transparent group/highlight align-baseline";
    }
    return "relative inline bg-transparent group/highlight";
  }, [action]);

  useEffect(() => {
    const element = elementRef.current;
    let annotation: RoughAnnotation | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let timeout: number | null = null;
    let resizeHandler: (() => void) | null = null;

    if (shouldShow && element) {
      timeout = window.setTimeout(() => {
        annotation = annotate(element, {
          type: action,
          color,
          strokeWidth,
          animationDuration: prefersReducedMotion ? 0 : animationDuration,
          iterations,
          padding,
          multiline,
        });
        annotation.show();

        const repaint = () => {
          if (!annotation) return;
          annotation.hide();
          annotation.show();
        };

        if (typeof ResizeObserver !== "undefined") {
          resizeObserver = new ResizeObserver(repaint);
          resizeObserver.observe(element);
        }

        resizeHandler = repaint;
        window.addEventListener("resize", resizeHandler, { passive: true });
      }, delay * 1000);
    }

    return () => {
      if (timeout !== null) {
        window.clearTimeout(timeout);
      }
      if (resizeHandler) {
        window.removeEventListener("resize", resizeHandler);
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (annotation) {
        annotation.remove();
      }
    };
  }, [
    shouldShow,
    action,
    color,
    strokeWidth,
    animationDuration,
    iterations,
    padding,
    multiline,
    delay,
    prefersReducedMotion,
  ]);

  return (
    <span ref={elementRef} className={inlineClassName}>
      {children}
    </span>
  );
}
