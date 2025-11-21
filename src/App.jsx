import React, { useEffect, useState } from "react";
import { AlertsPanel } from "./panels/AlertsPanel";
import { DecisionsPanel } from "./panels/DecisionsPanel";
import { RecordDetailsPanel } from "./panels/RecordDetailsPanel";
import { PreviewPanel } from "./panels/PreviewPanel";
import { BANK_DICTIONARY, BANK_VARIANTS_KEY } from "./constants/banks";
import {
  SUPPLIER_OPTIONS,
  SUPPLIERS_CANONICAL,
  SUPPLIER_VARIANTS_SEEDED,
  SUPPLIER_OFFICIAL_LOOKUP,
} from "./constants/suppliers";
import { MAX_ROWS, SUPPLIER_VARIANTS_KEY, FUZZY_BANK_AUTO, FUZZY_SUPPLIER_AUTO, FUZZY_SUPPLIER_SUGGEST } from "./constants/limits";
import { formatDateValue, normalizeName } from "./logic/normalization";
import { resolveBank, resolveSupplierValue } from "./logic/matching";
import { loadVariants, learnVariant, mergeAliasDict } from "./logic/learning";
import { mapRows, readExcelFile } from "./logic/excelParser";
import { addOneYear } from "./logic/dateUtils";
import { applyDecisionPropagation } from "./logic/decisionUtils";

export default function App() {
  const [fileInfo, setFileInfo] = useState(null);
  const [error, setError] = useState("");
  const [warnings, setWarnings] = useState([]);
  const [records, setRecords] = useState([]);
  const [needsReview, setNeedsReview] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [decisionDraft, setDecisionDraft] = useState({ bank: "", supplier: "" });
  const bankVariants = {};
  const [supplierVariants, setSupplierVariants] = useState(() =>
    loadVariants(SUPPLIER_VARIANTS_KEY, SUPPLIER_VARIANTS_SEEDED, SUPPLIER_OFFICIAL_LOOKUP)
  );

  const selectedRecord =
    records.find((r) => r.id === selectedId) ||
    needsReview.find((r) => r.id === selectedId) ||
    records[0] ||
    null;

  useEffect(() => {
    if (selectedRecord) {
      setDecisionDraft({
        bank: selectedRecord.bankFuzzySuggestion || selectedRecord.bankOfficial || "",
        supplier: selectedRecord.supplierFuzzySuggestion || selectedRecord.supplierOfficial || "",
      });
    } else {
      setDecisionDraft({ bank: "", supplier: "" });
    }
  }, [selectedRecord]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setError("");
    setWarnings([]);
    setRecords([]);
    setNeedsReview([]);
    setSelectedId(null);
    if (!file) {
      setFileInfo(null);
      return;
    }
    if (!file.name.toLowerCase().includes("xlsx") && !(file.type && file.type.includes("sheet"))) {
      setError("الملف قد لا يكون XLSX، سيتم المتابعة لكن يُفضل رفع ملف Excel صحيح.");
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("تنبيه: حجم الملف يتجاوز 20MB. يفضل تقليل الصفوف.");
    }
    setFileInfo({ name: file.name, size: file.size, file });
  };

  const handleAnalyze = async () => {
    if (!fileInfo?.file) {
      setError("لم يتم اختيار ملف بعد.");
      return;
    }
    try {
      const rawRows = await readExcelFile(fileInfo.file);
      if (rawRows.length < 1) throw new Error("EMPTY_ROWS");
      if (rawRows.length > MAX_ROWS) setWarnings((w) => [...w, `ملف كبير (${rawRows.length} صف). يفضل 100-150 كحد أقصى.`]);
      const mapped = mapRows(rawRows);
      const enriched = mapped.map((r) => {
        const bankRes = resolveBank(r.bankRaw, BANK_DICTIONARY, bankVariants, FUZZY_BANK_AUTO);
        const supRes = resolveSupplierValue(
          r.supplierRaw,
          supplierVariants,
          SUPPLIERS_CANONICAL.length ? SUPPLIERS_CANONICAL : SUPPLIER_OPTIONS,
          {
            fuzzyAuto: FUZZY_SUPPLIER_AUTO,
            fuzzySuggest: FUZZY_SUPPLIER_SUGGEST,
          }
        );
        return {
          ...r,
          bankDisplay: bankRes.official || r.bankRaw,
          supplierDisplay: supRes.official || r.supplierRaw,
          guaranteeNumber: r.guaranteeNo || r.guarantee_no || r.guarantee_number || "",
          contractNumber: r.contractNo || r.contract_no || r.contract_number || "",
          renewalDateDisplay: formatDateValue(r.dateRaw),
          bankStatus: bankRes.status,
          bankOfficial: bankRes.official,
          bankFuzzySuggestion: bankRes.fuzzySuggestion,
        supplierStatus: supRes.status,
        supplierOfficial: supRes.official,
        supplierFuzzySuggestion: supRes.fuzzySuggestion,
        supplierLearnStatus: supRes.learnStatus || null,
        supplierProbability: supRes.probability || null,
        needsDecision: bankRes.status !== "auto" || supRes.status !== "auto",
      };
    });
      const reviewList = enriched.filter((r) => r.needsDecision);
      setRecords(enriched);
      setNeedsReview(reviewList);
      setSelectedId(reviewList[0]?.id ?? enriched[0]?.id ?? null);
    } catch (err) {
      console.error(err);
      setError("فشل تحليل الملف. تأكد من أنه XLSX صالح.");
    }
  };

  const handleDecisionSave = (bankOfficial, supplierOfficial) => {
    if (!selectedRecord || !bankOfficial || !supplierOfficial) return;
    const oneYearExtension = addOneYear(selectedRecord.dateRaw);
    const renewalDateDisplay = oneYearExtension
      ? formatDateValue(oneYearExtension.toISOString())
      : selectedRecord.renewalDateDisplay;
    if (!oneYearExtension) {
      setWarnings((w) => [
        ...w,
        `تعذر تحويل تاريخ الانتهاء للصف ${selectedRecord.id}، لن يُحسب تمديد تلقائي.`,
      ]);
    }
    setSupplierVariants((dict) =>
      learnVariant(selectedRecord.supplierRaw, supplierOfficial, dict, SUPPLIER_VARIANTS_KEY)
    );

    const { records: updatedRecords, needsReview: updatedNeeds } = applyDecisionPropagation(
      records,
      selectedRecord,
      bankOfficial,
      supplierOfficial,
      renewalDateDisplay
    );
    setRecords(updatedRecords);
    setNeedsReview(updatedNeeds);
    setSelectedId(updatedNeeds[0]?.id ?? updatedRecords.find((r) => r.needsDecision)?.id ?? null);
  };

  useEffect(() => {
    // أدوات اختيارية من الـ Console للتصدير/الاستيراد دون واجهة
    window.learningTools = {
      exportLearning: () => ({
        version: 1,
        exportedAt: new Date().toISOString(),
        bankAliases: {},
        supplierVariants,
      }),
      importLearning: (payload) => {
        try {
          const parsed = typeof payload === "string" ? JSON.parse(payload) : payload;
          const mergedBank = {};
          const mergedSup = parsed.supplierVariants
            ? mergeAliasDict(supplierVariants, parsed.supplierVariants)
            : supplierVariants;
          localStorage.setItem(SUPPLIER_VARIANTS_KEY, JSON.stringify(mergedSup));
          setSupplierVariants(mergedSup);
        } catch (e) {
          console.error("فشل استيراد التعلم عبر Console", e);
        }
      },
    };
    return () => {
      delete window.learningTools;
    };
  }, [supplierVariants]);

  return (
    <div className="app" dir="rtl">
      <header className="app-header">
        <div>
          <p className="eyebrow">Guarantee Letter Automation Tool</p>
          <h1>نظام توليد خطابات تمديد الضمانات البنكية</h1>
          <p className="lede">رفع ملف Excel → حل الغموض → خطاب جاهز للطباعة.</p>
        </div>
      </header>

      <main className="app-main">
        <div className="top-grid">
          <section className="card">
            <div className="card-head">
              <div>
                <h2>1) رفع ملف Excel</h2>
                <p className="muted">الصيغة المدعومة: ‎.xlsx بترميز UTF-8 – الحجم الأقصى 20MB.</p>
                <p className="muted">اختر الملف ثم اضغط “بدء التحليل” لعرض السطور الغامضة.</p>
              </div>
            </div>
            <form className="field-inline" onSubmit={(e) => { e.preventDefault(); handleAnalyze(); }}>
              <input type="file" accept=".xlsx" onChange={handleFileChange} />
              <button type="submit">بدء التحليل</button>
            </form>
            <p className="muted">
              {fileInfo ? `الملف المختار: ${fileInfo.name} — ${(fileInfo.size / 1024).toFixed(1)} KB` : "لم يتم اختيار ملف بعد."}
            </p>
            <p className="error">{error}</p>
          </section>

          <AlertsPanel warnings={warnings} needsReviewCount={needsReview.length} />
        </div>

        <div className="layout-grid">
          <div className="left-column">
            <DecisionsPanel
              records={records}
              selectedId={selectedId}
              onSelect={setSelectedId}
              decisionDraft={decisionDraft}
              onDraftChange={setDecisionDraft}
              onDecision={handleDecisionSave}
              supplierVariants={supplierVariants}
            />
          </div>
          <div className="right-column">
            <RecordDetailsPanel record={selectedRecord} />
            <PreviewPanel record={selectedRecord || records[0]} />
          </div>
        </div>
      </main>
    </div>
  );
}
