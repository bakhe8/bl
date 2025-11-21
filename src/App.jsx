import React, { useMemo, useState } from "react";
import * as XLSX from "xlsx";

const MAX_ROWS = 150;
const BANK_OPTIONS = ["البنك العربي الوطني", "البنك الأهلي السعودي", "مصرف الراجحي", "بنك الرياض"];
const SUPPLIER_OPTIONS = ["شركة كير للتطوير", "شركة كير للتقنية", "شركة التوريد المتحدة"];

const BANK_VARIANTS_KEY = "bgl_bank_variants";
const SUPPLIER_VARIANTS_KEY = "bgl_supplier_variants";

const normalizeKey = (key) =>
  String(key || "")
    .trim()
    .toLowerCase()
    .replace(/[._\-]+/g, " ")
    .replace(/\s+/g, " ");

const pick = (row, keys) => {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") {
      return row[key];
    }
  }
  return "";
};

const normalizeName = (input) => {
  if (!input) return "";
  return String(input).toLowerCase().trim().replace(/\s+/g, " ").replace(/\./g, "");
};

const loadVariants = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const saveVariants = (key, dict) => {
  try {
    localStorage.setItem(key, JSON.stringify(dict));
  } catch {
    /* ignore */
  }
};

const exactMatch = (raw, variantsDict) => {
  const n = normalizeName(raw);
  if (!n) return null;
  return variantsDict[n] || null;
};

const simpleSimilarity = (a, b) => {
  if (!a || !b) return 0;
  const s1 = normalizeName(a);
  const s2 = normalizeName(b);
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1;
  let same = 0;
  for (let i = 0; i < Math.min(s1.length, s2.length); i++) {
    if (s1[i] === s2[i]) same++;
  }
  return same / maxLen;
};

const fuzzyMatch = (raw, variantsDict, threshold = 0.9) => {
  const keys = Object.keys(variantsDict);
  if (!keys.length) return null;
  let bestKey = null;
  let bestScore = 0;
  for (const key of keys) {
    const score = simpleSimilarity(raw, key);
    if (score > bestScore) {
      bestScore = score;
      bestKey = key;
    }
  }
  if (bestScore >= threshold) {
    return { key: bestKey, official: variantsDict[bestKey], score: bestScore };
  }
  return null;
};

const resolveValue = (raw, variantsDict, { enableFuzzy = true, fuzzyThreshold = 0.9 } = {}) => {
  if (!raw || !String(raw).trim()) {
    return { status: "manual", official: null, fuzzySuggestion: null };
  }
  const exact = exactMatch(raw, variantsDict);
  if (exact) return { status: "auto", official: exact, fuzzySuggestion: null };
  if (enableFuzzy) {
    const fuzzy = fuzzyMatch(raw, variantsDict, fuzzyThreshold);
    if (fuzzy) {
      return { status: "fuzzy", official: fuzzy.official, fuzzySuggestion: fuzzy.official };
    }
  }
  return { status: "manual", official: null, fuzzySuggestion: null };
};

const learnVariant = (raw, official, variantsDict, key) => {
  const n = normalizeName(raw);
  if (!n || !official) return variantsDict;
  if (variantsDict[n] && variantsDict[n] === official) return variantsDict;
  const updated = { ...variantsDict, [n]: official };
  saveVariants(key, updated);
  return updated;
};

export default function App() {
  const [fileInfo, setFileInfo] = useState(null);
  const [error, setError] = useState("");
  const [warnings, setWarnings] = useState([]);
  const [records, setRecords] = useState([]);
  const [needsReview, setNeedsReview] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [modal, setModal] = useState({ open: false, type: null, record: null });
  const [bankVariants, setBankVariants] = useState(() => loadVariants(BANK_VARIANTS_KEY));
  const [supplierVariants, setSupplierVariants] = useState(() => loadVariants(SUPPLIER_VARIANTS_KEY));

  const selectedRecord =
    records.find((r) => r.id === selectedId) ||
    needsReview.find((r) => r.id === selectedId) ||
    records[0] ||
    null;

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

  const handleAnalyze = () => {
    if (!fileInfo?.file) {
      setError("لم يتم اختيار ملف بعد.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const wb = XLSX.read(data, { type: "array" });
        const sheet = wb.SheetNames[0];
        if (!sheet) throw new Error("EMPTY");
        const rawRows = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { defval: "" });
        if (rawRows.length < 1) throw new Error("EMPTY_ROWS");
        if (rawRows.length > MAX_ROWS) setWarnings((w) => [...w, `ملف كبير (${rawRows.length} صف). يفضل 100-150 كحد أقصى.`]);
        const mapped = rawRows.map((row, idx) => {
          const keys = Object.fromEntries(Object.entries(row).map(([k, v]) => [normalizeKey(k), v]));
          return {
            id: idx + 1,
            bankRaw: pick(keys, ["bank", "bank name", "اسم البنك", "البنك"]),
            supplierRaw: pick(keys, ["supplier", "vendor", "اسم المورد", "المورد", "المتعهد", "contractor name"]),
            guaranteeNo:
              pick(keys, ["guarantee no", "guarantee", "bond_no", "bond no", "bank guarantee number", "رقم الضمان"]),
            contractNo: pick(keys, ["contract", "contract no", "contract number", "contract #", "رقم العقد"]),
            amount: pick(keys, ["amount", "value", "amount sar", "المبلغ"]),
            dateRaw: pick(keys, ["date", "expiry", "renewal", "expiry date", "تاريخ الانتهاء"]),
          };
        });
        const enriched = mapped.map((r) => {
          const bankRes = resolveValue(r.bankRaw, bankVariants, { enableFuzzy: true, fuzzyThreshold: 0.9 });
          const supRes = resolveValue(r.supplierRaw, supplierVariants, { enableFuzzy: true, fuzzyThreshold: 0.9 });
          return {
            ...r,
            bankDisplay: bankRes.official || r.bankRaw,
            supplierDisplay: supRes.official || r.supplierRaw,
            guaranteeNumber: r.guaranteeNo || r.guarantee_no || r.guarantee_number || "",
            contractNumber: r.contractNo || r.contract_no || r.contract_number || "",
            bankStatus: bankRes.status,
            bankOfficial: bankRes.official,
            bankFuzzySuggestion: bankRes.fuzzySuggestion,
            supplierStatus: supRes.status,
            supplierOfficial: supRes.official,
            supplierFuzzySuggestion: supRes.fuzzySuggestion,
            needsDecision: bankRes.status !== "auto" || supRes.status !== "auto",
          };
        });
        const reviewList = enriched.filter((r) => r.needsDecision);
        setRecords(enriched);
        setNeedsReview(reviewList);
        setSelectedId(reviewList[0]?.id ?? null);
      } catch (err) {
        console.error(err);
        setError("فشل تحليل الملف. تأكد من أنه XLSX صالح.");
      }
    };
    reader.readAsArrayBuffer(fileInfo.file);
  };

  const alertCount = useMemo(
    () => warnings.length + needsReview.length,
    [warnings.length, needsReview.length]
  );

  const removeSelected = () => {
    if (!selectedRecord) return;
    const next = needsReview.filter((r) => r.id !== selectedRecord.id);
    setNeedsReview(next);
    setRecords((recs) =>
      recs.map((r) =>
        r.id === selectedRecord.id
          ? {
              ...r,
              needsDecision: false,
              bankOfficial: modal.record?.bankOfficial || r.bankOfficial,
              supplierOfficial: modal.record?.supplierOfficial || r.supplierOfficial,
              bankDisplay: modal.record?.bankOfficial || r.bankDisplay || r.bankRaw,
              supplierDisplay: modal.record?.supplierOfficial || r.supplierDisplay || r.supplierRaw,
              bankStatus: "auto",
              supplierStatus: "auto",
            }
          : r
      )
    );
    setSelectedId(next[0]?.id ?? null);
  };

  const openDecision = () => {
    if (!selectedRecord) return;
    setModal({ open: true, type: "decision", record: selectedRecord });
  };

  const openLetter = () => {
    const rec = selectedRecord || needsReview[0] || records[0];
    if (!rec) return;
    setModal({ open: true, type: "letter", record: rec });
  };

  const handleDecisionSave = () => {
    removeSelected();
    setModal({ open: false, type: null, record: null });
  };

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
        <section className="card">
          <div className="card-head">
            <div>
              <h2>1) تحميل ملف الضمانات (Excel)</h2>
              <p className="muted">مدعوم: ‎.xlsx بترميز UTF-8 — حد الحجم 20MB.</p>
            </div>
          </div>
          <div className="field-group">
            <input type="file" accept=".xlsx" onChange={handleFileChange} />
            <button onClick={handleAnalyze}>بدء التحليل</button>
          </div>
          <p className="muted">
            {fileInfo ? `الملف المختار: ${fileInfo.name} — ${(fileInfo.size / 1024).toFixed(1)} KB` : ""}
          </p>
          <p className="error">{error}</p>
        </section>

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
            {needsReview.length ? <div>• {needsReview.length} صف يحتاج قرار</div> : null}
            {!warnings.length && !needsReview.length ? <div>لا توجد تنبيهات.</div> : null}
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <div>
              <h2>حلّ القرارات (البنك / المورد)</h2>
              <p className="muted">اختر صفاً غامضاً لتأكيد البنك والمورد.</p>
            </div>
            <div className="chip muted">{needsReview.length} صف غامض</div>
          </div>
          <div className="results">
            {records.length ? (
              <table className="mapping-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>البنك</th>
                    <th>المورد</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, idx) => (
                    <tr
                      key={r.id}
                      className={`${selectedId === r.id ? "selected-row" : ""} ${!r.needsDecision ? "resolved-row" : ""}`}
                      onClick={() => setSelectedId(r.id)}
                    >
                      <td>{idx + 1}</td>
                      <td>{r.bankDisplay || r.bankRaw || "-"}</td>
                      <td>{r.supplierDisplay || r.supplierRaw || "-"}</td>
                      <td className={r.needsDecision ? "text-amber" : "text-success"}>
                        {r.needsDecision ? "يحتاج تأكيد" : "جاهز"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              "لا توجد سجلات."
            )}
          </div>
          <div className="field-group">
            <button onClick={openDecision} disabled={!selectedRecord || !selectedRecord.needsDecision}>
              حل الحالات المعلقة
            </button>
            <button onClick={openLetter} disabled={!selectedRecord && !needsReview.length && !records.length}>
              معاينة خطاب
            </button>
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <div>
              <h2>تفاصيل السجل</h2>
              <p className="muted">عرض معلومات الصف المحدد.</p>
            </div>
          </div>
          <div className="results">
            {selectedRecord ? (
              <div className="warning-list">
                <div>
                  <strong>رقم الضمان:</strong>{" "}
                  {selectedRecord.guaranteeNumber || selectedRecord.guaranteeNo || selectedRecord.guarantee_no || "-"}
                </div>
                <div>
                  <strong>رقم العقد:</strong>{" "}
                  {selectedRecord.contractNumber || selectedRecord.contractNo || selectedRecord.contract_no || "-"}
                </div>
                <div>
                  <strong>البنك:</strong> {selectedRecord.bankDisplay || selectedRecord.bankRaw || "-"}
                </div>
                <div>
                  <strong>المورد:</strong> {selectedRecord.supplierDisplay || selectedRecord.supplierRaw || "-"}
                </div>
              </div>
            ) : (
              "لا يوجد سجل محدد."
            )}
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <div>
              <h2>معاينة الخطاب</h2>
              <p className="muted">خطاب عربي جاهز للطباعة للصف المحدد.</p>
            </div>
            <button onClick={openLetter} disabled={!selectedRecord && !needsReview.length && !records.length}>
              فتح المعاينة
            </button>
          </div>
          <div className="results">اختر صفًا ثم افتح المعاينة.</div>
        </section>
      </main>

      {modal.open && (
        <div className="modal-overlay" aria-hidden="false">
          <div className="modal">
            <div className="modal-header">
              <h3>{modal.type === "decision" ? "حل حالة غامضة" : "معاينة الخطاب"}</h3>
              <button onClick={() => setModal({ open: false, type: null, record: null })}>×</button>
            </div>
            <div className="modal-body">
              {modal.type === "decision" && modal.record && (
                <div className="space-y-2">
                  <p className="muted">صف: {modal.record.id}</p>
                  <div className="muted">البنك الخام: {modal.record.bankRaw || "-"}</div>
                  <div className="muted">المورد الخام: {modal.record.supplierRaw || "-"}</div>
                  <DecisionSelector
                    label="اختر البنك الرسمي:"
                    options={BANK_OPTIONS}
                    defaultValue={modal.record?.bankFuzzySuggestion || ""}
                    onSelect={(val) => setModal((m) => ({ ...m, record: { ...m.record, bankOfficial: val } }))}
                  />
                  <DecisionSelector
                    label="اختر المورد الرسمي:"
                    options={SUPPLIER_OPTIONS}
                    defaultValue={modal.record?.supplierFuzzySuggestion || ""}
                    onSelect={(val) => setModal((m) => ({ ...m, record: { ...m.record, supplierOfficial: val } }))}
                  />
                </div>
              )}
              {modal.type === "letter" && (
                <LetterPreview record={modal.record} />
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setModal({ open: false, type: null, record: null })}>إغلاق</button>
              {modal.type === "decision" && (
                <button
                  className="primary"
                  onClick={() => {
                    if (!modal.record?.bankOfficial || !modal.record?.supplierOfficial) return;
                    setBankVariants((dict) =>
                      learnVariant(modal.record.bankRaw, modal.record.bankOfficial, dict, BANK_VARIANTS_KEY)
                    );
                    setSupplierVariants((dict) =>
                      learnVariant(modal.record.supplierRaw, modal.record.supplierOfficial, dict, SUPPLIER_VARIANTS_KEY)
                    );
                    setRecords((recs) =>
                      recs.map((r) =>
                        r.id === modal.record.id
                          ? {
                              ...r,
                              bankStatus: "auto",
                              bankOfficial: modal.record.bankOfficial,
                              supplierStatus: "auto",
                              supplierOfficial: modal.record.supplierOfficial,
                              needsDecision: false,
                            }
                          : r
                      )
                    );
                    setNeedsReview((list) => list.filter((r) => r.id !== modal.record.id));
                    setSelectedId((id) => (id === modal.record.id ? null : id));
                    setModal({ open: false, type: null, record: null });
                  }}
                >
                  حفظ القرار
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DecisionSelector({ label, options, defaultValue, onSelect }) {
  return (
    <div className="space-y-1.5">
      <label className="muted">{label}</label>
      <select className="mapping-select" defaultValue={defaultValue} onChange={(e) => onSelect(e.target.value)}>
        <option value="">اختر...</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
        <option value="__other">أخرى...</option>
      </select>
      <input
        type="text"
        className="mapping-select"
        placeholder="إضافة قيمة جديدة"
        onBlur={(e) => {
          if (e.target.value.trim()) onSelect(e.target.value.trim());
        }}
      />
    </div>
  );
}

function LetterPreview({ record }) {
  const bankName = record?.bankDisplay || record?.bankOfficial || record?.bankRaw || "البنك الرسمي";
  const supplierName =
    record?.supplierDisplay || record?.supplierOfficial || record?.supplierRaw || "المورد";
  const guaranteeNo = record?.guaranteeNumber || record?.guaranteeNo || record?.guarantee_no || "-";
  const contractNo = record?.contractNumber || record?.contractNo || record?.contract_no || "-";
  const amount = record?.amount || "-";

  return (
    <div className="warning-list">
      <p>السادة / {bankName}</p>
      <p>المحترمين،</p>
      <p>
        الموضوع: طلب تمديد الضمان البنكي رقم ({guaranteeNo}) والعائد للعقد رقم ({contractNo})
      </p>
      <p>إشارة إلى الضمان البنكي الصادر منكم لصالح مستشفى الملك فيصل التخصصي، وبناءً على المعلومات التالية:</p>
      <ul>
        <li>المبلغ: {amount}</li>
        <li>اسم المورد: {supplierName}</li>
      </ul>
      <p>نأمل منكم التكرم بتمديد تاريخ الضمان المشار إليه.</p>
    </div>
  );
}
