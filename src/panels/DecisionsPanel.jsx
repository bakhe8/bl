import React, { useMemo } from "react";
import { ExpandedDecisionRow } from "../components/ExpandedDecisionRow";
import { BANK_OPTIONS } from "../constants/banks";
import { SUPPLIER_OPTIONS } from "../constants/suppliers";
import { normalizeName } from "../logic/normalization";

export function DecisionsPanel({
  records,
  selectedId,
  onSelect,
  decisionDraft,
  onDraftChange,
  onDecision,
  supplierVariants = {},
  suppliersCanonical = [],
}) {
  const supplierChoices = useMemo(() => {
    const learned = Object.values(supplierVariants || {}).map((v) => v?.official).filter(Boolean);
    const aliases = suppliersCanonical.flatMap((s) => s.aliases || []);
    const merged = [...SUPPLIER_OPTIONS, ...learned, ...aliases];
    return merged.filter((v, i, arr) => arr.indexOf(v) === i);
  }, [supplierVariants, suppliersCanonical]);

  const getDraftBank = (r) => {
    const suggested = r && (r.bankFuzzySuggestion || r.bankOfficial || r.bankDisplay || r.bankRaw);
    return decisionDraft.bank || suggested || "";
  };
  const getDraftSupplier = (r) => {
    const suggested = r && (r.supplierFuzzySuggestion || r.supplierOfficial || r.supplierDisplay || r.supplierRaw);
    return decisionDraft.supplier || suggested || "";
  };

  const statusInfo = (r) => {
    const bankAuto = r.bankStatus === "auto";
    const supplierAuto = r.supplierStatus === "auto";
    if (!bankAuto && !supplierAuto) return { label: "البنك والمورد", className: "text-amber" };
    if (!bankAuto && supplierAuto) return { label: "البنك", className: "text-blue" };
    if (bankAuto && !supplierAuto) return { label: "المورد", className: "text-purple" };
    return { label: "جاهز", className: "text-success" };
  };

  const supplierStageChip = (r) => {
    const stage = r.supplierLearnStatus;
    if (!stage) return null;
    const labels = {
      tentative: "تعلم أولي",
      semi: "تعلم مبدئي",
      confirmed: "مؤكد",
      permanent: "نهائي",
    };
    return <span className="chip subtle">{labels[stage] || stage}</span>;
  };

  const probabilityBar = (val) => {
    if (val === null || val === undefined) return null;
    const pct = Math.round(val * 100);
    return (
      <div className="prob-wrap">
        <div className="prob-bar">
          <div className="prob-fill" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
        </div>
        <span className="prob-label">{pct}%</span>
      </div>
    );
  };

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <h2>حلّ القرارات (البنك / المورد)</h2>
          <p className="muted">
            اختر صفاً غامضاً لتأكيد البنك والمورد. التعلّم محفوظ للموردين فقط؛ البنوك ثابتة من القاموس الرسمي.
          </p>
        </div>
        <div className="chip muted">{records.filter((r) => r.needsDecision).length} صف غامض</div>
      </div>
      {records.length ? (
        <table className="mapping-table">
          <thead>
            <tr>
              <th>#</th>
              <th>البنك</th>
              <th>المورد</th>
              <th>الحالة</th>
              <th>تعلّم المورد</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, idx) => {
              const isSelected = selectedId === r.id;
              const status = statusInfo(r);
              const bankValue = getDraftBank(r);
              const supplierValue = getDraftSupplier(r);
              const needsBank = r.bankStatus !== "auto";
              const needsSupplier = r.supplierStatus !== "auto";
              const bankOfficial = needsBank ? bankValue.trim() : r.bankDisplay || r.bankOfficial || r.bankRaw || "";
              const supplierOfficial = needsSupplier ? supplierValue.trim() : r.supplierDisplay || r.supplierOfficial || r.supplierRaw || "";
              const canSave = (!needsBank || bankOfficial) && (!needsSupplier || supplierOfficial);
              return (
                <React.Fragment key={r.id}>
                  <tr
                    className={`${isSelected ? "selected-row" : ""} ${!r.needsDecision ? "resolved-row" : ""}`}
                    onClick={() => onSelect(r.id)}
                  >
                    <td>{idx + 1}</td>
                    <td>
                      <div className="cell-main">{r.bankDisplay || r.bankRaw || "-"}</div>
                    </td>
                    <td>
                      <div className="cell-main">{r.supplierDisplay || r.supplierRaw || "-"}</div>
                      {probabilityBar(r.supplierProbability)}
                    </td>
                    <td className={status.className}>{status.label}</td>
                    <td>{supplierStageChip(r)}</td>
                  </tr>
                    {isSelected && r.needsDecision ? (
                      <tr className="inline-row">
                        <td colSpan={5}>
                          <div className="inline-decision">
                            <div className="inline-grid">
                            {needsBank ? (
                              <div className="inline-group">
                                <label className="muted">اختر البنك الرسمي:</label>
                                <select
                                  className="mapping-select"
                                  value={bankValue}
                                  onChange={(e) => onDraftChange((d) => ({ ...d, bank: e.target.value }))}
                                >
                                  <option value="">اختر...</option>
                                  {[bankValue, ...BANK_OPTIONS]
                                    .filter(Boolean)
                                    .filter((v, i, arr) => arr.indexOf(v) === i)
                                    .map((opt) => (
                                      <option key={opt} value={opt}>
                                        {opt}
                                      </option>
                                    ))}
                                </select>
                                <input
                                  type="text"
                                  className="mapping-select"
                                  placeholder="أو اكتب الاسم الرسمي بالعربية"
                                  value={bankValue}
                                  onChange={(e) => onDraftChange((d) => ({ ...d, bank: e.target.value }))}
                                />
                              </div>
                            ) : null}
                            {needsSupplier ? (
                              <div className="inline-group">
                                <label className="muted">اختر المورد الرسمي:</label>
                                <select
                                  className="mapping-select"
                                  value={supplierValue}
                                  onChange={(e) => onDraftChange((d) => ({ ...d, supplier: e.target.value }))}
                                >
                                  <option value="">اختر...</option>
                                  {[supplierValue, ...supplierChoices]
                                    .filter(Boolean)
                                    .filter((v, i, arr) => arr.indexOf(v) === i)
                                    .map((opt) => (
                                      <option key={opt} value={opt}>
                                        {opt}
                                      </option>
                                    ))}
                                </select>
                                <input
                                  type="text"
                                  className="mapping-select"
                                  placeholder="أو اكتب الاسم الرسمي بالعربية"
                                  value={supplierValue}
                                  onChange={(e) => onDraftChange((d) => ({ ...d, supplier: e.target.value }))}
                                />
                                {(() => {
                                  const normDraft = normalizeName(supplierValue || r.supplierFuzzySuggestion || r.supplierRaw || "");
                                  const canonicalMatch =
                                    suppliersCanonical.find(
                                      (c) => normalizeName(c.canonical) === normDraft
                                    ) ||
                                    suppliersCanonical.find(
                                      (c) => (c.normalized || normalizeName(c.canonical)) === normDraft
                                    );
                                  if (!canonicalMatch || !(canonicalMatch.aliases || []).length) return null;
                                  return (
                                    <div className="muted small-text">
                                      أسماء معروفة: {(canonicalMatch.aliases || []).join(" • ")}
                                    </div>
                                  );
                                })()}
                              </div>
                            ) : null}
                          </div>
                          <div className="inline-actions">
                            <button
                              className="primary"
                              onClick={() => onDecision(bankOfficial, supplierOfficial)}
                              disabled={!canSave}
                            >
                              حفظ القرار
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      ) : (
        <div className="muted">لا توجد سجلات.</div>
      )}
    </section>
  );
}
