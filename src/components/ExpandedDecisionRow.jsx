import React from "react";

export function ExpandedDecisionRow({ record }) {
  return (
    <div className="warning-list muted">
      <div>البنك الخام: {record.bankRaw || "-"}</div>
      <div>المورد الخام: {record.supplierRaw || "-"}</div>
    </div>
  );
}
