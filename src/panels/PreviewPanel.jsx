import React from "react";
import { formatDateValue } from "../logic/normalization";
import { toDisplayOneYear } from "../logic/dateUtils";

export function PreviewPanel({ record }) {
  const buildHtmlFromRecord = (rec) => {
    if (!rec) return null;
    const bankName = rec.bankDisplay || rec.bankOfficial || rec.bankRaw || "البنك الرسمي";
    const supplierName = rec.supplierDisplay || rec.supplierOfficial || rec.supplierRaw || "المورد";
    const guaranteeNo = rec.guaranteeNumber || rec.guaranteeNo || rec.guarantee_no || "-";
    const contractNo = rec.contractNumber || rec.contractNo || rec.contract_no || "-";
    const amountNum = Number(String(rec.amount || "").replace(/[^0-9.-]/g, ""));
    const amount =
      Number.isNaN(amountNum) || !Number.isFinite(amountNum)
        ? rec.amount || "-"
        : new Intl.NumberFormat("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amountNum);
    const expiry = formatDateValue(rec.dateRaw || "") || "-";
    const renewal = toDisplayOneYear(rec.dateRaw) || "-";

    return `
<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <style>
      body { font-family: "Cairo", "Segoe UI", sans-serif; margin: 20px; color: #1f1f1f; }
      .letter { max-width: 780px; margin: 0 auto; line-height: 1.8; font-size: 15px; }
      h1 { font-size: 18px; margin-bottom: 12px; }
      ul { padding-inline-start: 20px; }
    </style>
  </head>
  <body>
    <div class="letter">
      <p>السادة / ${bankName}</p>
      <p>المحترمين،</p>
      <p>الموضوع: طلب تمديد الضمان البنكي رقم (${guaranteeNo}) والعائد للعقد رقم (${contractNo})</p>
      <p>إشارة إلى الضمان البنكي الصادر منكم لصالح مستشفى الملك فيصل التخصصي، وبناءً على المعلومات التالية:</p>
      <ul>
        <li>المبلغ: ${amount}</li>
        <li>اسم المورد: ${supplierName}</li>
        <li>تاريخ الانتهاء: ${expiry}</li>
      </ul>
      <p>نأمل منكم التكرم بتمديد تاريخ الضمان المشار إليه حتى تاريخ ${renewal}.</p>
    </div>
  </body>
</html>`;
  };

  const htmlTemplate = record?.letterHtml || record?.rawHtml || buildHtmlFromRecord(record) || null;

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
