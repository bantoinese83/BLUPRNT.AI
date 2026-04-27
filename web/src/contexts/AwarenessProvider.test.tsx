/** @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { AwarenessProvider } from "./AwarenessProvider";
import { useAwareness } from "./AwarenessContext";
import type {
  ProjectRow,
  ScopeRow,
  LedgerEntryRow,
} from "@shared/types/database";

function Consumer() {
  const a = useAwareness();
  return (
    <div>
      <span data-testid="health">{a.projectHealth}</span>
      <span data-testid="count">{a.insights.length}</span>
      <span data-testid="next">{a.nextBestAction ?? ""}</span>
      <span data-testid="assistant-open">
        {a.isAssistantOpen ? "open" : "closed"}
      </span>
      <button
        data-testid="toggle-assistant"
        onClick={() => a.setIsAssistantOpen(!a.isAssistantOpen)}
      >
        Toggle
      </button>
    </div>
  );
}

const emptyProject = null;
const baseProject = {
  id: "p1",
  name: "Test",
  property_id: "pr",
  estimated_min_total: 1,
  estimated_max_total: 2,
  confidence_score: 0.5,
  stage: "planning",
  created_at: "2024-01-01T00:00:00.000Z",
} as unknown as ProjectRow;

describe("useAwareness", () => {
  it("throws when used outside AwarenessProvider", () => {
    function Bad() {
      useAwareness();
      return null;
    }
    expect(() => render(<Bad />)).toThrow(/AwarenessProvider/);
  });
});

describe("AwarenessProvider", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    cleanup();
  });

  it("provides optimal health when no project", () => {
    render(
      <AwarenessProvider
        project={emptyProject}
        scopeItems={[]}
        ledgerEntries={[]}
        spendByCategory={{}}
      >
        <Consumer />
      </AwarenessProvider>,
    );
    expect(screen.getByTestId("health")).toHaveTextContent("optimal");
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("flags budget overrun when spend exceeds scope max", () => {
    const scopeItems = [
      {
        id: "s1",
        category: "Kitchen",
        total_cost_max: 1000,
      },
    ] as unknown as ScopeRow[];

    render(
      <AwarenessProvider
        project={baseProject}
        scopeItems={scopeItems}
        ledgerEntries={[]}
        spendByCategory={{ Kitchen: 5000 }}
      >
        <Consumer />
      </AwarenessProvider>,
    );
    expect(screen.getByTestId("health")).toHaveTextContent("critical");
    expect(Number(screen.getByTestId("count").textContent)).toBeGreaterThan(0);
  });

  it("warns when spend is above 80% of max but not over budget", () => {
    const scopeItems = [
      { id: "s1", category: "Bath", total_cost_max: 1000 },
    ] as unknown as ScopeRow[];

    render(
      <AwarenessProvider
        project={baseProject}
        scopeItems={scopeItems}
        ledgerEntries={[]}
        spendByCategory={{ Bath: 850 }}
      >
        <Consumer />
      </AwarenessProvider>,
    );
    expect(screen.getByTestId("health")).toHaveTextContent("warning");
  });

  it("flags aggregate invoice total over scope with light line-item backing", () => {
    const scopeItems = [
      { id: "a", category: "A", total_cost_max: 5000 },
      { id: "b", category: "B", total_cost_max: 5000 },
    ] as unknown as ScopeRow[];
    const ledgerEntries = [{ total: 12_000 }] as unknown as LedgerEntryRow[];

    render(
      <AwarenessProvider
        project={{ ...baseProject, stage: "in_progress" } as ProjectRow}
        scopeItems={scopeItems}
        ledgerEntries={ledgerEntries}
        spendByCategory={{ A: 4000, B: 4000 }}
      >
        <Consumer />
      </AwarenessProvider>,
    );
    expect(screen.getByTestId("health")).toHaveTextContent("warning");
    expect(screen.getByTestId("count").textContent).not.toBe("0");
  });

  it("suggests defining scope during planning when empty", () => {
    render(
      <AwarenessProvider
        project={baseProject}
        scopeItems={[]}
        ledgerEntries={[]}
        spendByCategory={{}}
      >
        <Consumer />
      </AwarenessProvider>,
    );
    expect(screen.getByTestId("next")).toHaveTextContent("Add Items");
  });

  it("nudges invoice upload when past planning with no invoices", () => {
    render(
      <AwarenessProvider
        project={{ ...baseProject, stage: "in_progress" } as ProjectRow}
        scopeItems={[
          { id: "x", category: "K", total_cost_max: 100 } as ScopeRow,
        ]}
        ledgerEntries={[]}
        spendByCategory={{}}
      >
        <Consumer />
      </AwarenessProvider>,
    );
    expect(screen.getByTestId("next")).toHaveTextContent("Upload Document");
  });

  it("surfaces seller packet opportunity when spend is high enough", () => {
    const ledgerEntries = [{ total: 6000 }] as unknown as LedgerEntryRow[];
    const scopeItems = [
      { id: "s1", category: "Kitchen", total_cost_max: 8000 },
    ] as unknown as ScopeRow[];

    render(
      <AwarenessProvider
        project={{ ...baseProject, stage: "in_progress" } as ProjectRow}
        scopeItems={scopeItems}
        ledgerEntries={ledgerEntries}
        spendByCategory={{ Kitchen: 1000 }}
      >
        <Consumer />
      </AwarenessProvider>,
    );
    expect(screen.getByTestId("next")).toHaveTextContent("Export Packet");
  });

  it("uses generic next action copy when top insight has no CTA", () => {
    const scopeItems = [
      { id: "s1", category: "Roof", total_cost_max: 1000 },
    ] as unknown as ScopeRow[];

    render(
      <AwarenessProvider
        project={baseProject}
        scopeItems={scopeItems}
        ledgerEntries={[]}
        spendByCategory={{ Roof: 5000 }}
      >
        <Consumer />
      </AwarenessProvider>,
    );
    expect(screen.getByTestId("next")).toHaveTextContent("Review Insights");
  });

  it("manages assistant open/closed state", async () => {
    render(
      <AwarenessProvider
        project={baseProject}
        scopeItems={[]}
        ledgerEntries={[]}
        spendByCategory={{}}
      >
        <Consumer />
      </AwarenessProvider>,
    );
    expect(screen.getByTestId("assistant-open")).toHaveTextContent("closed");
    fireEvent.click(screen.getByTestId("toggle-assistant"));
    await screen.findByText("open"); // findBy is async and waits
  });
});
