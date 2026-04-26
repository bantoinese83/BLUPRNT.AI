/** @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, renderHook } from "@testing-library/react";
import { useRef, type ReactNode, type RefObject } from "react";
import { useFocusTrap } from "./use-focus-trap";

function Trap({
  active,
  children = null,
  testId = "trap",
}: {
  active: boolean;
  children?: ReactNode;
  testId?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(active, ref);
  return (
    <div ref={ref} data-testid={testId}>
      {children}
    </div>
  );
}

describe("useFocusTrap", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("no-ops when inactive", () => {
    const outside = document.createElement("button");
    document.body.appendChild(outside);
    outside.focus();

    render(
      <Trap active={false}>
        <button type="button">Inside</button>
      </Trap>,
    );

    expect(document.activeElement).toBe(outside);
    outside.remove();
  });

  it("no-ops when container ref is null", () => {
    const ref = { current: null } as RefObject<HTMLElement | null>;
    renderHook(() => useFocusTrap(true, ref));
  });

  it("focuses first focusable when trap activates", () => {
    render(
      <Trap active>
        <button type="button">First</button>
        <button type="button">Second</button>
      </Trap>,
    );

    const buttons = screen.getAllByRole("button");
    expect(document.activeElement).toBe(buttons[0]);
  });

  it("skips disabled and tabindex=-1 buttons when choosing first focusable", () => {
    render(
      <Trap active>
        <button type="button" tabIndex={-1}>
          Skipped
        </button>
        <button type="button" disabled>
          Off
        </button>
        <button type="button">Focus me</button>
      </Trap>,
    );

    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Focus me" }),
    );
  });

  it("focuses container when there are no focusables and adds tabindex", () => {
    const { getByTestId } = render(<Trap active testId="empty" />);
    const root = getByTestId("empty");
    expect(document.activeElement).toBe(root);
    expect(root).toHaveAttribute("tabindex", "-1");
  });

  it("does not duplicate tabindex when container already has tabindex", () => {
    function PrefixedTabIndex() {
      const ref = useRef<HTMLDivElement>(null);
      useFocusTrap(true, ref);
      return (
        <div ref={ref} data-testid="pref" tabIndex={-1}>
          <p>no buttons</p>
        </div>
      );
    }
    const { getByTestId } = render(<PrefixedTabIndex />);
    const root = getByTestId("pref");
    expect(document.activeElement).toBe(root);
    expect(root).toHaveAttribute("tabindex", "-1");
  });

  it("wraps Tab from last to first", () => {
    render(
      <Trap active>
        <button type="button">First</button>
        <button type="button">Second</button>
      </Trap>,
    );

    const trap = screen.getByTestId("trap");
    const buttons = screen.getAllByRole("button");
    buttons[1]!.focus();
    fireEvent.keyDown(trap, { key: "Tab" });
    expect(document.activeElement).toBe(buttons[0]);
  });

  it("wraps Shift+Tab from first to last", () => {
    render(
      <Trap active>
        <button type="button">First</button>
        <button type="button">Second</button>
      </Trap>,
    );

    const trap = screen.getByTestId("trap");
    const buttons = screen.getAllByRole("button");
    buttons[0]!.focus();
    fireEvent.keyDown(trap, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(buttons[1]);
  });

  it("ignores non-Tab keys", () => {
    render(
      <Trap active>
        <button type="button">First</button>
      </Trap>,
    );

    const trap = screen.getByTestId("trap");
    const btn = screen.getByRole("button");
    btn.focus();
    fireEvent.keyDown(trap, { key: "Escape" });
    expect(document.activeElement).toBe(btn);
  });

  it("does not handle Tab when there are no focusables", () => {
    const { getByTestId } = render(<Trap active testId="solo" />);
    const root = getByTestId("solo");
    root.focus();
    fireEvent.keyDown(root, { key: "Tab" });
    expect(document.activeElement).toBe(root);
  });

  it("skips aria-hidden and inert elements", () => {
    render(
      <Trap active>
        <button type="button" aria-hidden="true">
          Hidden
        </button>
        <button type="button">Visible</button>
        <button type="button" inert>
          Inert
        </button>
      </Trap>,
    );

    const visible = screen.getByRole("button", { name: "Visible" });
    expect(document.activeElement).toBe(visible);
  });

  it("skips focusables inside aria-hidden subtree", () => {
    render(
      <Trap active>
        <div aria-hidden="true">
          <button type="button">Nested</button>
        </div>
        <button type="button">Ok</button>
      </Trap>,
    );

    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Ok" }),
    );
  });

  it("restores previous focus and removes tabindex on deactivate", () => {
    const outside = document.createElement("button");
    outside.textContent = "Outside";
    document.body.appendChild(outside);
    outside.focus();

    const { rerender, getByTestId } = render(
      <Trap active>
        <button type="button">In</button>
      </Trap>,
    );

    expect(document.activeElement).not.toBe(outside);

    rerender(
      <Trap active={false}>
        <button type="button">In</button>
      </Trap>,
    );

    expect(document.activeElement).toBe(outside);
    expect(getByTestId("trap")).not.toHaveAttribute("tabindex");
    outside.remove();
  });
});
