import React from "react";
import { InfoRow } from "../components/InfoRow";

export function RecordDetailsPanel({ record }) {
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
          <InfoRow label="رقم السطر" value={record.id} />
          <InfoRow label="رقم الضمان" value={record.guaranteeNumber || record.guaranteeNo || record.guarantee_no} />
          <InfoRow label="رقم العقد" value={record.contractNumber || record.contractNo || record.contract_no} />
          <InfoRow label="البنك (خام/معتمد)" value={record.bankDisplay || record.bankRaw} />
          <InfoRow label="المورد (خام/معتمد)" value={record.supplierDisplay || record.supplierRaw} />
          <InfoRow label="المبلغ" value={record.amount} />
          <InfoRow label="تاريخ الانتهاء الأصلي" value={record.dateRaw || "-"} />
          <InfoRow label="تاريخ التمديد (عام كامل)" value={record.renewalDateDisplay || "-"} />
          <InfoRow label="حالة البنك" value={record.bankStatus} />
          <InfoRow label="حالة المورد" value={record.supplierStatus} />
        </div>
      ) : (
        <div className="muted">لا يوجد سجل محدد.</div>
      )}
    </section>
  );
}
