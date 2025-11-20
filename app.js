import { loadExcelFile } from "./modules/fileLoader.js";
import { parseWorkbookToRawRows } from "./modules/excelParser.js";
import { mapColumns } from "./modules/columnMapper.js";
import { normalizeRows } from "./modules/normalizer.js";

const REQUIRED_FIELDS = [
  "bank_raw",
  "supplier_raw",
  "guarantee_no",
  "contract_no",
  "amount_raw",
  "renewal_date_raw",
];

const excelInput = document.getElementById("excelInput");
const analyzeBtn = document.getElementById("analyzeBtn");
const fileInfo = document.getElementById("fileInfo");
const errorMessage = document.getElementById("errorMessage");
const resultsArea = document.getElementById("resultsArea");
const summaryChip = document.getElementById("summaryChip");

let selectedFile = null;

function resetUI() {
  errorMessage.textContent = "";
  resultsArea.textContent = "لم يتم بعد بدء التحليل.";
  summaryChip.textContent = "لم يبدأ التحليل";
}

excelInput.addEventListener("change", (e) => {
  resetUI();
  const file = e.target.files[0];

  if (!file) {
    selectedFile = null;
    analyzeBtn.disabled = true;
    fileInfo.textContent = "";
    return;
  }

  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    errorMessage.textContent = "الملف المرفوع ليس بصيغة XLSX. الرجاء اختيار ملف Excel صحيح.";
    excelInput.value = "";
    selectedFile = null;
    analyzeBtn.disabled = true;
    fileInfo.textContent = "";
    return;
  }

  const maxSizeBytes = 1 * 1024 * 1024; // 1MB
  if (file.size > maxSizeBytes) {
    errorMessage.textContent = "حجم الملف يتجاوز الحد المسموح به (1MB). الرجاء تقليل عدد الصفوف.";
    excelInput.value = "";
    selectedFile = null;
    analyzeBtn.disabled = true;
    fileInfo.textContent = "";
    return;
  }

  selectedFile = file;
  analyzeBtn.disabled = false;
  fileInfo.textContent = `الملف المختار: ${file.name} — الحجم: ${(file.size / 1024).toFixed(1)} KB`;
});

function summarize(rows, warnings) {
  const total = rows.length;
  const missingRequired = rows.filter((row) =>
    REQUIRED_FIELDS.some((f) => !row[f] || String(row[f]).trim() === "")
  ).length;
  const warningText = [];
  if (missingRequired > 0) warningText.push(`صفوف ناقصة: ${missingRequired}`);
  if (warnings.length) warningText.push(`تنبيهات: ${warnings.length}`);
  summaryChip.textContent =
    total === 0 ? "لا صفوف" : `صفوف: ${total}` + (warningText.length ? ` | ${warningText.join(" / ")}` : "");
}

analyzeBtn.addEventListener("click", async () => {
  if (!selectedFile) return;

  errorMessage.textContent = "";
  resultsArea.textContent = "جاري قراءة الملف وتحليله...";
  summaryChip.textContent = "جارٍ التحليل...";

  try {
    const workbook = await loadExcelFile(selectedFile);
    const rawRows = parseWorkbookToRawRows(workbook);
    if (!rawRows.length) {
      throw new Error("EMPTY_ROWS");
    }

    const { rows: mappedRows, warnings } = mapColumns(rawRows);
    const normalizedRows = normalizeRows(mappedRows);

    summarize(normalizedRows, warnings);

    const preview = normalizedRows.slice(0, 10);
    const pre = document.createElement("pre");
    pre.textContent = JSON.stringify({ preview, warnings }, null, 2);
    resultsArea.textContent = "";
    resultsArea.appendChild(pre);
  } catch (err) {
    console.error(err);
    let message = "حدث خطأ أثناء قراءة الملف. تأكد من أن الملف بصيغة XLSX وترميزه سليم (UTF-8).";
    if (err.message === "EMPTY_ROWS") {
      message = "الملف لا يحتوي على صفوف قابلة للقراءة.";
    } else if (err.message === "NO_SHEETJS") {
      message = "مكتبة SheetJS غير متوفرة. تأكد من تحميلها أو تضمينها محلياً.";
    }
    errorMessage.textContent = message;
    resultsArea.textContent = "فشل التحليل.";
    summaryChip.textContent = "فشل التحليل";
  }
});
