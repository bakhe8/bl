import { describe, it, expect } from "vitest";
import { parseDateValue, addOneYear, toDisplayOneYear } from "../dateUtils";

describe("dateUtils", () => {
  it("parses Excel serial numbers", () => {
    const d = parseDateValue(45932);
    expect(d).not.toBeNull();
    expect(d.getFullYear()).toBeGreaterThan(2020);
  });

  it("adds one year when possible", () => {
    const d = addOneYear("2024-01-31");
    expect(d.getFullYear()).toBe(2025);
  });

  it("handles invalid date gracefully", () => {
    const d = addOneYear("foo");
    expect(d).toBeNull();
  });

  it("formats display when valid", () => {
    const display = toDisplayOneYear("2024-02-01");
    expect(typeof display).toBe("string");
    expect(display).not.toBe("");
  });
});
