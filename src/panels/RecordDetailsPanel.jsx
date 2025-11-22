import React from "react";
import { InfoRow } from "../components/InfoRow";
import { formatDateValue } from "../logic/normalization";
import { toDisplayOneYear } from "../logic/dateUtils";

export function RecordDetailsPanel({ record }) {
  const formatAmount = (value) => {
    if (value === null || value === undefined || value === "") return "-";
    const num = Number(String(value).replace(/[^0-9.-]/g, ""));
    if (Number.isNaN(num)) return String(value);
    return new Intl.NumberFormat("ar-SA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const expiryDisplay = record ? formatDateValue(record.dateRaw || "") : "-";
  const renewalDisplay = record ? toDisplayOneYear(record.dateRaw) || "-" : "-";

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <h2>تفاصيل السجل</h2>
          <p className="muted">عرض معلومات الصف المحدد.</p>
        </div>
      </div>
      {record ? (
        <div className="warning-list">
          <InfoRow label="رقم الضمان" value={record.guaranteeNumber || record.guaranteeNo || record.guarantee_no || "-"} />
          <InfoRow label="رقم العقد" value={record.contractNumber || record.contractNo || record.contract_no || "-"} />
          <InfoRow label="البنك" value={record.bankDisplay || record.bankRaw || "-"} />
          <InfoRow label="المورد" value={record.supplierDisplay || record.supplierRaw || "-"} />
          <InfoRow label="المبلغ" value={formatAmount(record.amount)} />
          <InfoRow label="تاريخ الانتهاء" value={expiryDisplay} />
          <InfoRow label="التمديد إلى" value={renewalDisplay} />
        </div>
      ) : (
        <div className="muted">لا يوجد سجل محدد.</div>
      )}
    </section>
  );
}
