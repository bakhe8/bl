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
    const bgUrl = `${window.location.origin}/templates/letter_bg.svg`;

    return `
<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <style>
      body {
        font-size:20px !important;
        background: transparent;
        padding: 40px;
        font-family: 'Cairo', 'Segoe UI', sans-serif;
        line-height: 1.9;
      }
      .letter-preview {
        background: none;
        padding: 0;
        border: none;
        direction: rtl;
        width: auto;
        min-height: auto;
        margin: auto;
        box-shadow: none;
      }
      .letter-preview .card-head h2 {
        margin: 0;
        font-size: 1.4rem;
        font-weight: 700;
      }
      .letter-preview .card-head .muted {
        margin: 4px 0 12px;
        font-size: 0.9rem;
        color: #666;
      }
      .A4 {
        font-size:20px !important;
        box-sizing: border-box;
        padding-top: 2.4in;
        padding-right: 1in;
        padding-left: 1in;
        padding-bottom: 1in;
        background: #ffffff url("${bgUrl}") top center/contain no-repeat;
        border-radius: 6px;
        border: 2px solid #c8c8c8;
        box-shadow:
          0 0 40px rgba(0,0,0,0.30),
          0 12px 22px rgba(0,0,0,0.25),
          0 4px 6px rgba(0,0,0,0.20);
        width: 794px;
        min-height: 1123px;
        margin-left: auto;
        margin-right: auto;
        display: block;
        position: relative;
      }
      .subject {
        background: #fafafa;
        padding: 10px;
        border-radius: 6px;
        border: 1px solid #e0e0e0;
        margin: 0;
      }
      .info-list { margin: 12px 0; padding-right: 20px; }
      .info-list li { margin-bottom: 6px; }
      .A4::before {
        content: "";
        position: absolute;
        top: 2.4in;
        left: 1in;
        right: 1in;
        bottom: 1in;
        border: 2px dashed rgba(0,0,0,0.15);
        pointer-events: none;
      }
      .A4 p {
        margin: 0;
        text-align: justify;
        text-justify: inter-word;
      }
      .first-paragraph { text-align: justify !important; text-justify: inter-word;  }
      .justify-filler { display: inline-block; width: 100%; opacity: 0; }
      .email-wrapper-fixed { direction: rtl; unicode-bidi: isolate; display: inline-block; }
      .arabic-spacer { display: inline-block; width: 0; }
      .email-block {
        display: inline-block;
        direction: ltr;
        unicode-bidi: bidi-override;
        text-align: left;
      }
      .A4 p + p { margin-top: 0; }
    </style>
  </head>
  <body>
    <section class="letter-preview">
      <div class="A4">
        <div class="header-line" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <div class="to-line" style="margin:0;">السادة / ${bankName}</div>
          <div class="greeting" style="margin:0;">المحترمين</div>
        </div>

        <div style="margin:0; line-height:1.6;">
          <div style="margin:0; line-height:1;">
            <div>إدارة المؤسسات المالية - قسم الضمانات</div>
            <div>ص.ب. ٥٦٠٠٦ الرياض ١١٥٥٤</div>
            <div>بريد الكتروني: bgfinance@kfshrc.edu.sa</div>
          </div>

          <div style="text-align:right; font-weight:normal; margin:0;">السَّلام عليكُم ورحمَة الله وبركاتِه</div>

          <div class="subject">
            الموضوع:
            طلب تمديد الضمان البنكي رقم (${guaranteeNo}) والعائد للعقد رقم (${contractNo})
          </div>

          <div class="first-paragraph">
            إشارة الى الضمان البنكي الموضح أعلاه، والصادر منكم لصالح مستشفى الملك فيصل التخصصي ومركز الأبحاث بالرياض
            على حساب ${supplierName} بمبلغ قدره ${amount}. نأمل منكم تمديد فترة سريان الضمان حتى تاريخ ${renewal} (تاريخ الانتهاء الحالي ${expiry}) مع بقاء الشروط الأخرى دون تغيير،
            وإفادتنا بذلك من خلال البريد الإلكتروني المخصص للضمانات البنكية لدى مستشفى الملك فيصل التخصصي ومركز الأبحاث بالرياض (bgfinance@kfshrc.edu.sa).
          </div>

          <div>كما نأمل منكم إرسال أصل تمديد الضمان إلى:</div>
          <div style="margin-right:2.5em;">مستشفى الملك فيصل التخصصي ومركز الأبحاث – الرياض</div>
          <div style="margin-right:2.5em;">ص.ب ٣٣٥٤ الرياض ١١٢١١</div>
          <div style="margin-right:2.5em;">مكتب الخدمات الإدارية</div>

          <div class="first-paragraph">
            علمًا بأنه في حال عدم تمكن البنك من تمديد الضمان المذكور قبل انتهاء مدة سريانه، فيجب على البنك دفع قيمة الضمان إلينا حسب النظام.
          </div>

          <div style="text-indent:4em;">وَتفضَّلوا بِقبُول خَالِص تحيَّاتِي</div>

          <div style="text-align: center ; margin-right:10em;">
            مُدير الإدارة العامَّة للعمليَّات المحاسبيَّة<br><br>
            سَامِي بن عبَّاس الفايز
          </div>
        </div>
      </div>
    </section>
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
          <div className="letter-iframe-wrap">
            <iframe
              title="letter-preview"
              className="letter-iframe"
              srcDoc={htmlTemplate}
              sandbox=""
              scrolling="no"
            />
          </div>
        ) : (
          <div className="muted">لا يوجد قالب HTML مرفق لهذا السجل.</div>
        )
      ) : (
        <div className="muted">اختر صفًا لعرض الخطاب.</div>
      )}
    </section>
  );
}
