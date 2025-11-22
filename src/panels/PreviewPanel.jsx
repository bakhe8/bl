import React, { useEffect, useRef, useState } from "react";
import { formatDateValue } from "../logic/normalization";
import { toDisplayOneYear } from "../logic/dateUtils";

export function PreviewPanel({ record }) {
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(0.8);
  const [scaledWidth, setScaledWidth] = useState("100%");

  useEffect(() => {
    const updateScale = () => {
      if (!wrapRef.current) return;
      const width = wrapRef.current.getBoundingClientRect().width || 0;
      // نجعل الهدف ديناميكياً بحسب العرض المتاح (أقصى حد 850px)
      const targetWidth = Math.min(850, Math.max(680, width * 0.96));
      const nextScale = Math.min(1, Math.max(0.45, width / (targetWidth + 16)));
      setScale(nextScale);
      setScaledWidth(`${targetWidth}px`);
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

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
        : new Intl.NumberFormat("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            .format(amountNum)
            .replace(/٬/g, ",");
    const expiry = formatDateValue(rec.dateRaw || "") || "-";
    const renewal = toDisplayOneYear(rec.dateRaw) || "-";
    const bgUrl = `${window.location.origin}/templates/letter_bg.svg`;

    // نعيد فقط محتوى القسم المطلوب بدون هيكل صفحة كامل لتقليل الفراغات داخل الإطار.
    return `
<style>
  :root {
    font-family: 'Cairo', 'Segoe UI', sans-serif;
    line-height: 1.9;
  }
  @font-face {
    font-family: 'AL-Mohanad';
    src: url('${window.location.origin}/templates/AL-Mohanad Bold.ttf') format('truetype');
    font-weight: bold;
    font-style: normal;
    unicode-range: U+0600-06FF, U+0750-077F, U+08A0-08FF;
  }
  @font-face {
    font-family: 'ArialBodyCS';
    src: local("Arial (Body CS)"), local("Arial");
    font-weight: normal;
    font-style: normal;
    unicode-range: U+0000-00FF;
  }
  .fw-800-sharp {
    font-weight: 800;
    text-shadow:
      0.015em 0       currentColor,
     -0.015em 0       currentColor,
      0      0.015em  currentColor,
      0     -0.015em  currentColor,
      0.01em  0.01em  currentColor,
     -0.01em  0.01em  currentColor,
      0.01em -0.01em  currentColor,
     -0.01em -0.01em  currentColor;
  }
  .letter-inline,
  .letter-inline * {
    font-family: 'AL-Mohanad', 'ArialBodyCS', 'Arial', sans-serif !important;
    line-height: 23pt; /* تباعد أسطر ثابت كما في Word */
  }
  .letter-preview {
    background: none;
    padding: 0;
    border: none;
    direction: rtl;
    width: auto;
    min-height: auto;
    margin: 0 auto;
    box-shadow: none;
  }
  .letter-inline .A4 {
    font-size:15pt !important;
    box-sizing: border-box;
    padding-top: 2.4in;
    padding-right: 1in;
    padding-left: 1in;
    padding-bottom: 1in;
    background: #ffffff url("${bgUrl}") top center/contain no-repeat;
    border: none;
    box-shadow: none;
    width: 210mm;
    min-height: 297mm;
    margin-left: auto;
    margin-right: auto;
    display: block;
    position: relative;
  }
  .subject {
    background: #f0f1f5;
    padding: 10px;
    border-radius: 6px;
    border: 1px solid #c8c9d1;
    margin: 0;
  }
  .info-list { margin: 12px 0; padding-right: 20px; }
  .info-list li { margin-bottom: 6px; }
      .A4::before {
        content: none;
      }
  .A4 p {
    margin: 0;
    text-align: justify;
    text-justify: inter-word;
  }
  .first-paragraph { text-align: justify !important; text-justify: inter-word; }
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
<section class="letter-preview">
  <div class="A4">
    <div class="header-line" style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin:0; line-height:23pt;">
      <div class="to-line fw-800-sharp" style="margin:0; line-height:23pt;">السادة / ${bankName}</div>
      <div class="greeting" style="margin:0; line-height:23pt;">المحترمين</div>
    </div>

    <div style="margin:0; line-height:23pt;">
      <div style="margin:0; line-height:23pt;">
        <div class="fw-800-sharp" style="margin:0; line-height:23pt;">إدارة المؤسسات المالية - قسم الضمانات</div>
        <div class="fw-800-sharp" style="margin:0; line-height:23pt;">ص.ب. ٥٦٠٠٦ الرياض ١١٥٥٤</div>
        <div style="margin:0; line-height:23pt;">
          <span class="fw-800-sharp">بريد الكتروني:</span>
          <span style="text-shadow:none; font-family:'ArialBodyCS','Arial',sans-serif; font-weight:400;"> bgfinance@kfshrc.edu.sa</span>
        </div>
      </div>

      <div style="text-align:right; font-weight:normal; margin:0 0 1px 0; line-height:23pt;">السَّلام عليكُم ورحمَة الله وبركاتِه</div>

      <div class="subject" style="padding: 1px; margin: 0; display:flex; align-items:flex-start; flex-wrap:wrap;">
        <span style="flex:0 0 70px; min-width:70px; margin:0; line-height:23pt;">الموضوع:</span>
        <span style="flex:1 1 0; margin:0; line-height:23pt;">
          طلب تمديد الضمان البنكي رقم (${guaranteeNo}) والعائد للعقد رقم (${contractNo})
        </span>
      </div>

      <div class="first-paragraph">
        إشارة الى الضمان البنكي الموضح أعلاه، والصادر منكم لصالحنا على حساب ${supplierName} بمبلغ قدره (${amount})، نأمل منكم <span class="fw-800-sharp" style="display:inline;">تمديد فترة سريان الضمان حتى تاريخ ${renewal}</span>، مع بقاء الشروط الأخرى دون تغيير،
        وإفادتنا بذلك من خلال البريد الإلكتروني المخصص للضمانات البنكية لدى مستشفى الملك فيصل التخصصي ومركز الأبحاث بالرياض (bgfinance@kfshrc.edu.sa)، كما نأمل منكم إرسال أصل تمديد الضمان إلى:
      </div>

      <div style="margin:0; line-height:23pt; padding-right:2.5em;">
        <div style="margin:0; line-height:23pt;">مستشفى الملك فيصل التخصصي ومركز الأبحاث – الرياض</div>
        <div style="margin:0; line-height:23pt;">ص.ب ٣٣٥٤ الرياض ١١٢١١</div>
        <div style="margin:0; line-height:23pt;">مكتب الخدمات الإدارية</div>
      </div>

      <div class="first-paragraph" style="margin-top:0; line-height:23pt;">
        علمًا بأنه في حال عدم تمكن البنك من تمديد الضمان المذكور قبل انتهاء مدة سريانه، فيجب على البنك دفع قيمة الضمان إلينا حسب النظام.
      </div>

    <div style="text-indent:5em; margin-top:6px; line-height:23pt; margin-bottom:0;">وَتفضَّلوا بِقبُول خَالِص تحيَّاتِي</div>

    <div class="fw-800-sharp" style="text-align: center; margin-right:17em; line-height:32pt; margin-top:0;">
        مُدير الإدارة العامَّة للعمليَّات المحاسبيَّة<br><br>
        سَامِي بن عبَّاس الفايز
      </div>

    <div style="position:absolute; left:1in; right:1in; bottom:0.7in; display:flex; justify-content:space-between; font-size:8.5pt; line-height:11pt; font-weight:300; font-family:'ArialBodyCS','Arial',sans-serif; text-shadow:none;">
      <span>MBC:09-2</span>
      <span>BAMZ</span>
    </div>
    </div>
  </div>
</section>`;
  };

  const htmlTemplate = record?.letterHtml || record?.rawHtml || buildHtmlFromRecord(record) || null;

  const handlePrint = () => {
    if (!htmlTemplate) return;
    const bgUrl = `${window.location.origin}/templates/letter_bg.svg`;
    const container = document.createElement("div");
    container.id = "print-container";
    container.innerHTML = `
      <style>
        @page { size: A4; margin: 0; }
        @font-face {
          font-family: 'AL-Mohanad';
          src: url('${window.location.origin}/templates/AL-Mohanad Bold.ttf') format('truetype');
          font-weight: bold;
          font-style: normal;
          unicode-range: U+0600-06FF, U+0750-077F, U+08A0-08FF;
        }
        @font-face {
          font-family: 'ArialBodyCS';
          src: local("Arial (Body CS)"), local("Arial");
          font-weight: normal;
          font-style: normal;
          unicode-range: U+0000-00FF;
        }
        .fw-800-sharp {
          font-weight: 800;
          text-shadow:
            0.015em 0       currentColor,
           -0.015em 0       currentColor,
            0      0.015em  currentColor,
            0     -0.015em  currentColor,
            0.01em  0.01em  currentColor,
           -0.01em  0.01em  currentColor,
            0.01em -0.01em  currentColor,
           -0.01em -0.01em  currentColor;
        }
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        #print-container {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          background: #fff;
          padding: 0;
          margin: 0;
        }
        #print-container .letter-preview { margin: 0; padding: 0; width: 210mm; }
        #print-container .letter-preview .A4 {
          font-size:15pt !important;
          box-sizing: border-box;
          padding-top: 2.2in;
          padding-right: 1in;
          padding-left: 1in;
          padding-bottom: 1in;
          background: #ffffff url("${bgUrl}") top center/contain no-repeat;
          border: none;
          box-shadow: none;
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          position: relative;
        }
        #print-container .letter-inline, #print-container .letter-inline * {
          font-family: 'AL-Mohanad', 'ArialBodyCS', 'Arial', sans-serif !important;
        }
      </style>
      <div class="letter-inline">${htmlTemplate}</div>
    `;
    document.body.appendChild(container);
    setTimeout(() => {
      window.print();
      document.body.removeChild(container);
    }, 400);
  };

  return (
    <>
      {record && htmlTemplate && (
        <div className="print-wrap">
          <button type="button" className="print-btn" onClick={handlePrint}>
            طباعة PDF
          </button>
          <div className="letter-iframe-wrap" ref={wrapRef}>
            <div
              className="letter-inline"
              style={{
                transform: `scale(${scale})`,
                transformOrigin: "top center",
                width: scaledWidth,
              }}
              dangerouslySetInnerHTML={{ __html: htmlTemplate }}
            />
          </div>
        </div>
      )}
    </>
  );
}
