import React from "react";
import { ExpandedDecisionRow } from "../components/ExpandedDecisionRow";
import { BANK_OPTIONS } from "../constants/banks";
import { SUPPLIER_OPTIONS } from "../constants/suppliers";

export function DecisionsPanel({ records, selectedId, onSelect, decisionDraft, onDraftChange, onDecision }) {
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
    if (!bankAuto && !supplierAuto) return { label: "يحتاج تأكيد البنك والمورد", className: "text-amber" };
    if (!bankAuto && supplierAuto) return { label: "يحتاج تأكيد البنك فقط", className: "text-blue" };
    if (bankAuto && !supplierAuto) return { label: "يحتاج تأكيد المورد فقط", className: "text-purple" };
    return { label: "جاهز", className: "text-success" };
  };

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <h2>حلّ القرارات (البنك / المورد)</h2>
          <p className="muted">اختر صفاً غامضاً لتأكيد البنك والمورد.</p>
        </div>
        <div className="chip muted">{records.filter((r) => r.needsDecision).length} صف غامض</div>
      </div>
      <div className="results">
        {records.length ? (
          <table className="mapping-table">
            <thead>
              <tr>
                <th>#</th>
                <th>البنك</th>
                <th>المورد</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, idx) => {
                const isSelected = selectedId === r.id;
                const status = statusInfo(r);
                const bankValue = getDraftBank(r);
                const supplierValue = getDraftSupplier(r);
                return (
                  <React.Fragment key={r.id}>
                    <tr
                      className={`${isSelected ? "selected-row" : ""} ${!r.needsDecision ? "resolved-row" : ""}`}
                      onClick={() => onSelect(r.id)}
                    >
                      <td>{idx + 1}</td>
                      <td>{r.bankDisplay || r.bankRaw || "-"}</td>
                      <td>{r.supplierDisplay || r.supplierRaw || "-"}</td>
                      <td className={status.className}>{status.label}</td>
                    </tr>
                    {isSelected && r.needsDecision ? (
                      <tr className="inline-row">
                        <td colSpan={4}>
                          <div className="inline-decision">
                            <div className="inline-grid">
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
                              <div className="inline-group">
                                <label className="muted">اختر المورد الرسمي:</label>
                                <select
                                  className="mapping-select"
                                  value={supplierValue}
                                  onChange={(e) => onDraftChange((d) => ({ ...d, supplier: e.target.value }))}
                                >
                                  <option value="">اختر...</option>
                                  {[supplierValue, ...SUPPLIER_OPTIONS]
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
                              </div>
                            </div>
                            <div className="inline-actions">
                              <button
                                className="primary"
                                onClick={() => onDecision(bankValue.trim(), supplierValue.trim())}
                                disabled={!bankValue.trim() || !supplierValue.trim()}
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
          "لا توجد سجلات."
        )}
      </div>
    </section>
  );
}
