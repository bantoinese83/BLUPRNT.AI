import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

function isHidden(el: HTMLElement): boolean {
  return el.getAttribute("aria-hidden") === "true" || el.hasAttribute("inert");
}

function collectFocusables(root: HTMLElement): HTMLElement[] {
  const nodes = root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
  const out: HTMLElement[] = [];
  nodes.forEach((el) => {
    if (isHidden(el)) return;
    if (el.closest("[aria-hidden='true'], [inert]")) return;
    if (el.tabIndex === -1 && !el.hasAttribute("href")) return;
    out.push(el);
  });
  return out;
}

/**
 * Keeps keyboard focus inside `containerRef` while `active` is true and restores
 * focus to the previously focused element on teardown.
 */
export function useFocusTrap(
  active: boolean,
  containerRef: RefObject<HTMLElement | null>,
) {
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const root = containerRef.current;
    previousFocus.current = document.activeElement as HTMLElement | null;

    const list = collectFocusables(root);
    if (list.length > 0) {
      list[0]!.focus();
    } else {
      if (!root.hasAttribute("tabindex")) {
        root.setAttribute("tabindex", "-1");
      }
      root.focus();
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const focusables = collectFocusables(root);
      if (focusables.length === 0) return;
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    root.addEventListener("keydown", onKeyDown);
    return () => {
      root.removeEventListener("keydown", onKeyDown);
      root.removeAttribute("tabindex");
      previousFocus.current?.focus?.();
      previousFocus.current = null;
    };
  }, [active, containerRef]);
}
