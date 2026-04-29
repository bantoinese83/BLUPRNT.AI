import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { formatShortUsDate } from "@shared/lib/formatters";
import { money, getStars } from "./formatters";

describe("formatShortUsDate (shared)", () => {
  it("formats ISO timestamps", () => {
    expect(formatShortUsDate("2026-04-18T12:00:00.000Z")).toMatch(/Apr/);
    expect(formatShortUsDate("2026-04-18T12:00:00.000Z")).toMatch(/2026/);
  });
});

describe("money", () => {
  it("formats single value correctly", () => {
    expect(money(1000)).toBe("$1,000");
  });

  it("formats range correctly", () => {
    expect(money(1000, 2000)).toBe("$1,000 – $2,000");
  });

  it("handles null values", () => {
    expect(money(null)).toBe("—");
    expect(money(1000, null)).toBe("$1,000");
    expect(money(null, 2000)).toBe("—");
  });

  it("handles zero value", () => {
    expect(money(0)).toBe("$0");
  });
});

describe("getStars", () => {
  it("returns default stars (3) when score is null", () => {
    const stars = getStars(null);
    const { container } = render(<>{stars}</>);
    const filledStars = container.querySelectorAll(".fill-amber-400");
    expect(filledStars).toHaveLength(3);
  });

  it("clamps score to 0", () => {
    const stars = getStars(-1);
    const { container } = render(<>{stars}</>);
    const filledStars = container.querySelectorAll(".fill-amber-400");
    expect(filledStars).toHaveLength(0);
  });

  it("clamps score to 5", () => {
    const stars = getStars(6);
    const { container } = render(<>{stars}</>);
    const filledStars = container.querySelectorAll(".fill-amber-400");
    expect(filledStars).toHaveLength(5);
  });

  it("rounds values correctly", () => {
    const stars3 = getStars(3.4);
    const { container: container3 } = render(<>{stars3}</>);
    expect(container3.querySelectorAll(".fill-amber-400")).toHaveLength(3);

    const stars4 = getStars(3.5);
    const { container: container4 } = render(<>{stars4}</>);
    expect(container4.querySelectorAll(".fill-amber-400")).toHaveLength(4);
  });

  it("handles identical range in money", () => {
    expect(money(1000, 1000)).toBe("$1,000");
  });
});
