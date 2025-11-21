import { normalizeName } from "./normalization";

export const applyDecisionPropagation = (records, selectedRecord, bankOfficial, supplierOfficial, renewalDateDisplay) => {
  const updatedRecords = records.map((r) => {
    const sameBank = normalizeName(r.bankRaw) === normalizeName(selectedRecord.bankRaw);
    const sameSupplier = normalizeName(r.supplierRaw) === normalizeName(selectedRecord.supplierRaw);
    if (r.id === selectedRecord.id) {
      return {
        ...r,
        bankStatus: "auto",
        bankOfficial,
        bankDisplay: bankOfficial,
        supplierStatus: "auto",
        supplierOfficial,
        supplierDisplay: supplierOfficial,
        renewalDateDisplay,
        needsDecision: false,
      };
    }
    if (sameBank && r.bankStatus !== "auto") {
      const newNeedsDecision = r.supplierStatus !== "auto";
      return {
        ...r,
        bankStatus: "auto",
        bankOfficial,
        bankDisplay: bankOfficial,
        needsDecision: newNeedsDecision,
      };
    }
    if (sameSupplier && r.supplierStatus !== "auto") {
      const newNeedsDecision = r.bankStatus !== "auto";
      return {
        ...r,
        supplierStatus: "auto",
        supplierOfficial,
        supplierDisplay: supplierOfficial,
        needsDecision: newNeedsDecision,
      };
    }
    return r;
  });
  const needsReview = updatedRecords.filter((r) => r.needsDecision);
  return { records: updatedRecords, needsReview };
};
