import React from "react";
import { LetterPreview } from "../shared/LetterPreview";

export function PreviewPanel({ record }) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <h2>معاينة الخطاب</h2>
          <p className="muted">خطاب عربي جاهز للطباعة للصف المحدد.</p>
        </div>
      </div>
      {record ? <LetterPreview record={record} /> : <div className="muted">اختر صفًا لعرض الخطاب.</div>}
    </section>
  );
}
