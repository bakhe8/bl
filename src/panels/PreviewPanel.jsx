import React from "react";

export function PreviewPanel({ record }) {
  const htmlTemplate = record?.letterHtml || record?.rawHtml || null;

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <h2>معاينة الخطاب</h2>
          <p className="muted">خطاب عربي جاهز للطباعة للصف المحدد.</p>
        </div>
      </div>
      {record ? (
        htmlTemplate ? (
          <iframe
            title="letter-preview"
            className="letter-iframe"
            srcDoc={htmlTemplate}
            sandbox=""
          />
        ) : (
          <div className="muted">لا يوجد قالب HTML مرفق لهذا السجل.</div>
        )
      ) : (
        <div className="muted">اختر صفًا لعرض الخطاب.</div>
      )}
    </section>
  );
}
