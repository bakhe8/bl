import { describe, it, expect } from "vitest";
import { normalizeName } from "../normalization";
import { resolveSupplierValue } from "../matching";

describe("normalizeName", () => {
  it("removes diacritics and normalizes spaces/Case", () => {
    const input = "  الأَهْلي  البنك  ";
    expect(normalizeName(input)).toBe("الاهلي البنك");
  });
});

describe("resolveSupplierValue", () => {
  const officialList = ["شركة كير للتطوير", "شركة الهدى للتجارة"];

  it("returns auto for exact official match", () => {
    const res = resolveSupplierValue("شركة كير للتطوير", {}, officialList, { fuzzyAuto: 0.9, fuzzySuggest: 0.8 });
    expect(res.status).toBe("auto");
    expect(res.official).toBe("شركة كير للتطوير");
  });

  it("returns auto for learned variant even إذا لم يصل 3 مرات", () => {
    const variants = { "cure dev": { official: "شركة كير للتطوير", occurrences: 1, confirmed: false } };
    const res = resolveSupplierValue("CURE DEV", variants, officialList, { fuzzyAuto: 0.9, fuzzySuggest: 0.8 });
    expect(res.status).toBe("auto");
    expect(res.official).toBe("شركة كير للتطوير");
  });

  it("returns fuzzy suggestion when close to official", () => {
    const res = resolveSupplierValue("شركة كير للتطوي", {}, officialList, { fuzzyAuto: 0.99, fuzzySuggest: 0.5 });
    expect(res.status).toBe("fuzzy");
    expect(res.fuzzySuggestion).toBe("شركة كير للتطوير");
  });
});
