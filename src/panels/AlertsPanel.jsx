import React from "react";

export function AlertsPanel({ warnings, needsReviewCount }) {
  const alertCount = warnings.length + needsReviewCount;
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <h2>الأخطاء والتنبيهات</h2>
          <p className="muted">عرض مختصر للتنبيهات وعدد الصفوف الغامضة.</p>
        </div>
        <div className="chip muted">{alertCount} تنبيه</div>
      </div>
      <div className="warning-list">
        {warnings.map((w, i) => (
          <div key={i}>• {w}</div>
        ))}
        {needsReviewCount ? <div>• {needsReviewCount} صف يحتاج قرار</div> : null}
        {!warnings.length && !needsReviewCount ? <div>لا توجد تنبيهات.</div> : null}
      </div>
    </section>
  );
}
