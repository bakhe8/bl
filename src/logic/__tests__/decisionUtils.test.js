import { describe, it, expect } from "vitest";
import { applyDecisionPropagation } from "../decisionUtils";

describe("applyDecisionPropagation", () => {
  const selected = {
    id: 1,
    bankRaw: "ANB",
    supplierRaw: "CURE DEV",
    bankStatus: "manual",
    supplierStatus: "manual",
    needsDecision: true,
  };
  const baseRecords = [
    selected,
    { id: 2, bankRaw: "ANB", supplierRaw: "OTHER SUP", bankStatus: "manual", supplierStatus: "auto", needsDecision: true },
    { id: 3, bankRaw: "OTHER", supplierRaw: "CURE DEV", bankStatus: "auto", supplierStatus: "manual", needsDecision: true },
  ];

  it("marks selected as auto and propagates bank", () => {
    const { records, needsReview } = applyDecisionPropagation(baseRecords, selected, "بنك عربي", "شركة كير", "2025");
    const rec1 = records.find((r) => r.id === 1);
    const rec2 = records.find((r) => r.id === 2);
    const rec3 = records.find((r) => r.id === 3);
    expect(rec1.needsDecision).toBe(false);
    expect(rec2.bankStatus).toBe("auto");
    expect(rec2.needsDecision).toBe(false); // supplier was auto
    expect(rec3.supplierStatus).toBe("auto");
    expect(needsReview.every((r) => r.needsDecision === true)).toBe(true);
  });
});
