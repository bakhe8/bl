import { describe, it, expect } from "vitest";
import { mergeAliasDict } from "../learning";

describe("mergeAliasDict", () => {
  it("merges occurrences and confirmed flags", () => {
    const current = { foo: { official: "A", occurrences: 1, confirmed: false } };
    const incoming = { foo: { official: "A", occurrences: 2, confirmed: false } };
    const merged = mergeAliasDict(current, incoming);
    expect(merged.foo.occurrences).toBe(3);
    expect(merged.foo.confirmed).toBe(true);
  });

  it("keeps official name when strings or objects vary", () => {
    const current = { foo: "Bank A" };
    const incoming = { foo: { official: "Bank A", occurrences: 1, confirmed: false } };
    const merged = mergeAliasDict(current, incoming);
    expect(merged.foo.official).toBe("Bank A");
  });
});
