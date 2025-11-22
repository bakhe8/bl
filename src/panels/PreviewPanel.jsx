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
        : new Intl.NumberFormat("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amountNum);
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
  }
  @font-face {
    font-family: 'AL-Mohanad-ExtraBold';
    src: url('${window.location.origin}/templates/AL-Mohanad Extra Bold.ttf') format('truetype');
    font-weight: 800;
    font-style: normal;
  }
  @font-face {
    font-family: 'AL-Mohanad-Regular';
    src: url('${window.location.origin}/templates/AL-Mohanad.ttf') format('truetype');
    font-weight: 400;
    font-style: normal;
    unicode-range: U+0000-00FF; /* اللاتينية فقط */
  }
  .letter-inline,
  .letter-inline * {
    font-family: 'AL-Mohanad-Regular', 'AL-Mohanad', 'Cairo', 'Segoe UI', sans-serif !important;
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
    padding-top: 2.2in;
    padding-right: 1in;
    padding-left: 1in;
    padding-bottom: 1in;
    background: #ffffff url("${bgUrl}") top center/contain no-repeat;
    border: none;
    box-shadow: none;
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
      <div class="to-line" style="margin:0; line-height:23pt; text-shadow: 0 0 1px currentColor, 0.4px 0 currentColor, -0.4px 0 currentColor;">السادة / ${bankName}</div>
      <div class="greeting" style="margin:0; line-height:23pt;">المحترمين</div>
    </div>

    <div style="margin:0; line-height:23pt;">
      <div style="margin:0; line-height:23pt;">
        <div style="margin:0; line-height:23pt; text-shadow: 0 0 1px currentColor, 0.4px 0 currentColor, -0.4px 0 currentColor;">إدارة المؤسسات المالية - قسم الضمانات</div>
        <div style="margin:0; line-height:23pt; text-shadow: 0 0 1px currentColor, 0.4px 0 currentColor, -0.4px 0 currentColor;">ص.ب. ٥٦٠٠٦ الرياض ١١٥٥٤</div>
        <div style="margin:0; line-height:23pt; text-shadow: 0 0 1px currentColor, 0.4px 0 currentColor, -0.4px 0 currentColor;">
          بريد الكتروني:
          <span style="text-shadow:none; font-family:'AL-Mohanad-Regular','AL-Mohanad','Cairo','Segoe UI',sans-serif;"> bgfinance@kfshrc.edu.sa</span>
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
        إشارة الى الضمان البنكي الموضح أعلاه، والصادر منكم لصالح مستشفى الملك فيصل التخصصي ومركز الأبحاث بالرياض
        على حساب ${supplierName} بمبلغ قدره (${amount})، نأمل منكم <span style="display:inline; font-weight:800; text-shadow: 0 0 1px currentColor, 0.4px 0 currentColor, -0.4px 0 currentColor;">تمديد فترة سريان الضمان حتى تاريخ ${renewal}</span>، مع بقاء الشروط الأخرى دون تغيير،
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

    <div style="text-align: center; margin-right:17em; line-height:32pt; margin-top:0; text-shadow: 0 0 1px currentColor, 0.4px 0 currentColor, -0.4px 0 currentColor;">
        مُدير الإدارة العامَّة للعمليَّات المحاسبيَّة<br><br>
        سَامِي بن عبَّاس الفايز
      </div>

    <div style="position:absolute; left:1in; right:1in; bottom:0.7in; display:flex; justify-content:space-between; font-size:8.5pt; line-height:11pt; font-weight:300; font-family:'AL-Mohanad-Regular','AL-Mohanad','Cairo','Segoe UI',sans-serif; text-shadow:none;">
      <span>MBC:09-2</span>
      <span>BAMZ</span>
    </div>
    </div>
  </div>
</section>`;
  };

  const htmlTemplate = record?.letterHtml || record?.rawHtml || buildHtmlFromRecord(record) || null;

  return (
    <>
      {record && htmlTemplate && (
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
      )}
    </>
  );
}
