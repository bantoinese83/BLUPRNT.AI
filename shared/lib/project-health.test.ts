import { describe, it, expect } from "vitest";
import { calculateHealthScore } from "./project-health.ts";

describe("calculateHealthScore", () => {
  it("returns Analyzing state when min is 0", () => {
    const result = calculateHealthScore(100, 0, 1000);
    expect(result.status).toBe("Analyzing");
    expect(result.score).toBe(0);
  });

  it("returns Analyzing state when spending is 0", () => {
    const result = calculateHealthScore(0, 500, 1000);
    expect(result.status).toBe("Analyzing");
    expect(result.score).toBe(0);
  });

  it("returns Over Budget when utilization > 100%", () => {
    const result = calculateHealthScore(1100, 500, 1000);
    expect(result.status).toBe("Over Budget");
    expect(result.score).toBeLessThan(70);
    expect(result.pctOfEstimateHigh).toBeCloseTo(110);
    expect(result.dollarsOverHighEstimate).toBe(100);
  });

  it("returns At Limit when utilization > 85%", () => {
    const result = calculateHealthScore(900, 500, 1000);
    expect(result.status).toBe("At Limit");
    expect(result.score).toBe(75);
  });

  it("returns Excellent when progress < 20%", () => {
    const result = calculateHealthScore(50, 500, 1000);
    expect(result.status).toBe("Excellent");
    expect(result.score).toBe(95);
  });

  it("returns Healthy for normal progress", () => {
    const result = calculateHealthScore(300, 500, 1000);
    expect(result.status).toBe("Healthy");
    expect(result.score).toBe(88);
    expect(result.pctOfEstimateHigh).toBeCloseTo(30);
    expect(result.dollarsOverHighEstimate).toBe(0);
  });
});
