import React from "react";
import { formatDateValue } from "../logic/normalization";

export function RecordDetailsPanel({ record, collapsed = false, onToggleCollapse = () => {} }) {
  const formatAmount = (value) => {
    if (value === null || value === undefined || value === "") return "-";
    const num = Number(String(value).replace(/[^0-9.-]/g, ""));
    if (Number.isNaN(num)) return String(value);
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  return (
    <section className="card">
      <div className="card-head">
        <button type="button" className="collapse-btn" onClick={onToggleCollapse} aria-label="طي/فتح">
          {collapsed ? "＋" : "－"}
        </button>
        <div>
          <h2>معلومات السجل المحدد</h2>
        </div>
      </div>
      {!collapsed ? (
        record ? (
        <div className="details-grid">
          <div className="details-col">
            <div className="info-row">
              <span className="info-label">رقم الضمان:</span>
              <span className="info-value">{record.guaranteeNumber || record.guaranteeNo || record.guarantee_no || "-"}</span>
            </div>
            <div className="info-row">
              <span className="info-label">رقم العقد:</span>
              <span className="info-value">{record.contractNumber || record.contractNo || record.contract_no || "-"}</span>
            </div>
            <div className="info-row">
              <span className="info-label">البنك:</span>
              <span className="info-value">{record.bankDisplay || record.bankRaw || "-"}</span>
            </div>
          </div>
          <div className="details-col">
            <div className="info-row">
              <span className="info-label">المورد:</span>
              <span className="info-value">{record.supplierDisplay || record.supplierRaw || "-"}</span>
            </div>
            <div className="info-row">
              <span className="info-label">المبلغ:</span>
              <span className="info-value">{formatAmount(record.amount)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">تاريخ الانتهاء:</span>
              <span className="info-value">{formatDateValue(record.dateRaw || "") || "-"}</span>
            </div>
          </div>
        </div>
        ) : (
          <div className="muted">لا يوجد سجل محدد.</div>
        )
      ) : null}
    </section>
  );
}
