import { loadExcelFile } from "./modules/fileLoader.js";
import { parseWorkbookToRawRows } from "./modules/excelParser.js";
import {
  REQUIRED_FIELDS,
  detectMapping,
  applyMapping,
  loadStoredMapping,
  saveMapping,
} from "./modules/columnMapper.js";
import { normalizeRows } from "./modules/normalizer.js";

const excelInput = document.getElementById("excelInput");
const analyzeBtn = document.getElementById("analyzeBtn");
const fileInfo = document.getElementById("fileInfo");
const errorMessage = document.getElementById("errorMessage");
const resultsArea = document.getElementById("resultsArea");
const summaryChip = document.getElementById("summaryChip");

const mappingArea = document.createElement("div");
mappingArea.id = "mappingArea";
mappingArea.className = "card";

let selectedFile = null;
let rawRowsCache = [];
let headersCache = [];
let mappingState = {};

function resetUI() {
  errorMessage.textContent = "";
  resultsArea.textContent = "لم يتم بعد بدء التحليل.";
  summaryChip.textContent = "لم يبدأ التحليل";
  mappingArea.innerHTML = "";
}

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

function renderWarnings(list) {
  if (!list.length) return "";
  return `<ul class="warning-list">${list.map((w) => `<li>${w}</li>`).join("")}</ul>`;
}

function isMappingComplete(mapping) {
  return REQUIRED_FIELDS.every((f) => mapping[f]);
}

function renderMappingUI(headers) {
  if (!headers.length) {
    mappingArea.innerHTML = "";
    return;
  }
  const stored = loadStoredMapping();
  mappingState = detectMapping(headers, stored);

  const options = (field) =>
    ['<option value="">غير محدد</option>']
      .concat(headers.map((h) => `<option value="${h}" ${mappingState[field] === h ? "selected" : ""}>${h}</option>`))
      .join("");

  const rows = REQUIRED_FIELDS.map(
    (field) => `
      <tr>
        <td>${field}</td>
        <td>
          <select class="mapping-select" data-field="${field}">
            ${options(field)}
          </select>
        </td>
      </tr>
    `
  ).join("");

  mappingArea.innerHTML = `
    <div class="card-head">
      <div>
        <h2>تعيين الأعمدة</h2>
        <p class="muted">اضبط مطابقة أعمدة Excel إلى الحقول المنطقية. يتم حفظ الاختيارات محلياً.</p>
      </div>
    </div>
    <table class="mapping-table">
      <thead>
        <tr><th>الحقل المنطقي</th><th>عمود Excel</th></tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;

  mappingArea.querySelectorAll("select.mapping-select").forEach((sel) => {
    sel.value = mappingState[sel.dataset.field] || "";
    sel.addEventListener("change", () => {
      mappingState[sel.dataset.field] = sel.value;
      saveMapping(mappingState);
      if (rawRowsCache.length) {
        processWithMapping();
      }
    });
  });
}

function processWithMapping() {
  if (!rawRowsCache.length) return;
  resultsArea.textContent = "جاري تطبيق التعيين...";
  const warnings = [];
  if (!isMappingComplete(mappingState)) {
    resultsArea.textContent = "الرجاء إكمال تعيين الأعمدة المطلوبة.";
    summaryChip.textContent = "تعيين غير مكتمل";
    return;
  }
  const { rows: mappedRows, warnings: mapWarnings } = applyMapping(rawRowsCache, mappingState);
  warnings.push(...mapWarnings);
  const normalizedRows = normalizeRows(mappedRows);
  summarize(normalizedRows, warnings);
  const preview = normalizedRows.slice(0, 10);
  const pre = document.createElement("pre");
  pre.textContent = JSON.stringify({ preview, warnings }, null, 2);
  resultsArea.textContent = "";
  resultsArea.appendChild(pre);
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

analyzeBtn.addEventListener("click", async () => {
  if (!selectedFile) return;

  errorMessage.textContent = "";
  resultsArea.textContent = "جاري قراءة الملف وتحليله...";
  summaryChip.textContent = "جارٍ التحليل...";

  try {
    const workbook = await loadExcelFile(selectedFile);
    rawRowsCache = parseWorkbookToRawRows(workbook);
    if (!rawRowsCache.length) {
      throw new Error("EMPTY_ROWS");
    }

    headersCache = Object.keys(rawRowsCache[0] || {});
    renderMappingUI(headersCache);
    // أدخل mapping UI قبل بطاقة النتائج إذا لم يكن موجوداً
    const main = document.querySelector(".app-main");
    if (!document.getElementById("mappingArea")) {
      main.insertBefore(mappingArea, main.children[1] || null);
    }

    processWithMapping();
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
