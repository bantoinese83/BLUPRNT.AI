import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AwarenessProvider } from "./AwarenessProvider";
import { useAwareness } from "./AwarenessContext";
import type { ProjectRow, ScopeRow } from "@shared/types/database";

function Consumer() {
  const a = useAwareness();
  return (
    <div>
      <span data-testid="health">{a.projectHealth}</span>
      <span data-testid="count">{a.insights.length}</span>
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

describe("AwarenessProvider", () => {
  it("provides optimal health when no project", () => {
    render(
      <AwarenessProvider
        project={emptyProject}
        scopeItems={[]}
        invoices={[]}
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
        invoices={[]}
        spendByCategory={{ Kitchen: 5000 }}
      >
        <Consumer />
      </AwarenessProvider>,
    );
    expect(screen.getByTestId("health")).toHaveTextContent("critical");
    expect(Number(screen.getByTestId("count").textContent)).toBeGreaterThan(0);
  });
});
