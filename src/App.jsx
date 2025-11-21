import { useMemo, useState } from "react";
import * as XLSX from "xlsx";

const MAX_ROWS = 150;
const BANK_OPTIONS = ["البنك العربي الوطني", "البنك الأهلي السعودي", "مصرف الراجحي", "بنك الرياض"];
const SUPPLIER_OPTIONS = ["شركة كير للتطوير", "شركة كير للتقنية", "شركة التوريد المتحدة"];

const normalizeKey = (key) =>
  String(key || "").trim().toLowerCase().replace(/\s+/g, " ");

const pick = (row, keys) => {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") {
      return row[key];
    }
  }
  return "";
};

export default function App() {
  const [fileInfo, setFileInfo] = useState(null);
  const [error, setError] = useState("");
  const [warnings, setWarnings] = useState([]);
  const [rows, setRows] = useState([]);
  const [needsReview, setNeedsReview] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [modal, setModal] = useState({ open: false, type: null, record: null });

  const selectedRecord = needsReview.find((r) => r.id === selectedId) || needsReview[0] || null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setError("");
    setWarnings([]);
    setRows([]);
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
            supplierRaw: pick(keys, ["supplier", "vendor", "اسم المورد", "المورد", "المتعهد"]),
            guaranteeNo: pick(keys, ["guarantee no", "guarantee", "bond_no", "رقم الضمان"]),
            contractNo: pick(keys, ["contract", "contract no", "رقم العقد"]),
            amount: pick(keys, ["amount", "value", "المبلغ"]),
            dateRaw: pick(keys, ["date", "expiry", "renewal", "تاريخ الانتهاء"]),
          };
        });
        setRows(mapped);
        setNeedsReview(mapped);
        setSelectedId(mapped[0]?.id ?? null);
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
    setSelectedId(next[0]?.id ?? null);
  };

  const openDecision = () => {
    if (!selectedRecord) return;
    setModal({ open: true, type: "decision", record: selectedRecord });
  };

  const openLetter = () => {
    const rec = selectedRecord || needsReview[0] || rows[0];
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
            {needsReview.length ? (
              <table className="mapping-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>البنك (خام)</th>
                    <th>المورد (خام)</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {needsReview.map((r, idx) => (
                    <tr
                      key={r.id}
                      className={selectedId === r.id ? "selected-row" : ""}
                      onClick={() => setSelectedId(r.id)}
                    >
                      <td>{idx + 1}</td>
                      <td>{r.bankRaw || "-"}</td>
                      <td>{r.supplierRaw || "-"}</td>
                      <td className="text-amber">يحتاج تأكيد</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              "لا توجد صفوف غامضة."
            )}
          </div>
          <div className="field-group">
            <button onClick={openDecision} disabled={!selectedRecord}>
              حل الحالات المعلقة
            </button>
            <button onClick={openLetter} disabled={!selectedRecord && !needsReview.length && !rows.length}>
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
                  <strong>رقم الضمان:</strong> {selectedRecord.guaranteeNo || "-"}
                </div>
                <div>
                  <strong>رقم العقد:</strong> {selectedRecord.contractNo || "-"}
                </div>
                <div>
                  <strong>البنك (خام):</strong> {selectedRecord.bankRaw || "-"}
                </div>
                <div>
                  <strong>المورد (خام):</strong> {selectedRecord.supplierRaw || "-"}
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
            <button onClick={openLetter} disabled={!selectedRecord && !needsReview.length && !rows.length}>
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
                  <div className="space-y-1.5">
                    <label className="muted">اختر البنك الرسمي:</label>
                    <select className="mapping-select">
                      {BANK_OPTIONS.map((b) => (
                        <option key={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="muted">اختر المورد الرسمي:</label>
                    <select className="mapping-select">
                      {SUPPLIER_OPTIONS.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              {modal.type === "letter" && (
                <div className="warning-list">
                  <p>السادة / البنك الرسمي</p>
                  <p>المحترمين،</p>
                  <p>
                    الموضوع: طلب تمديد الضمان البنكي رقم ({modal.record?.guaranteeNo || "-"
                    }) والعائد للعقد رقم ({modal.record?.contractNo || "-"})
                  </p>
                  <p>إشارة إلى الضمان البنكي الصادر منكم لصالح مستشفى الملك فيصل التخصصي، وبناءً على المعلومات التالية:</p>
                  <ul>
                    <li>المبلغ: {modal.record?.amount || "-"}</li>
                    <li>اسم المورد: {modal.record?.supplierRaw || "-"}</li>
                  </ul>
                  <p>نأمل منكم التكرم بتمديد تاريخ الضمان المشار إليه.</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setModal({ open: false, type: null, record: null })}>إغلاق</button>
              {modal.type === "decision" && (
                <button className="primary" onClick={handleDecisionSave}>
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
