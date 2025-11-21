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
import {
  loadDictionaries,
  saveDictionaries,
  addOfficial,
  addOrUpdateVariant,
  getOfficialList,
  getOfficialNameById,
} from "./modules/dictionaryEngine.js";
import { matchRows } from "./modules/matchingEngine.js";
import { loadTemplate, renderLetter } from "./modules/letterBuilder.js";

const excelInput = document.getElementById("excelInput");
const analyzeBtn = document.getElementById("analyzeBtn");
const fileInfo = document.getElementById("fileInfo");
const errorMessage = document.getElementById("errorMessage");
const resultsArea = document.getElementById("resultsArea");
const summaryChip = document.getElementById("summaryChip");

const mappingArea = document.createElement("div");
mappingArea.id = "mappingArea";
mappingArea.className = "card";
const modalOverlay = document.getElementById("modalOverlay");
const modalBody = document.getElementById("modalBody");
const modalTitle = document.getElementById("modalTitle");
const modalPrimary = document.getElementById("modalPrimary");
const modalSecondary = document.getElementById("modalSecondary");
const modalClose = document.getElementById("modalClose");

let selectedFile = null;
let rawRowsCache = [];
let headersCache = [];
let mappingState = {};
let dictionaries = loadDictionaries();
let matchState = { autoMatched: [], needsReview: [], warnings: [] };
let letterTemplateHtml = "";

// افتراضياً اترك زر التحليل مفعلاً؛ الضغط بدون ملف لن يقوم بشيء لكن يسهل الاستجابة عند اختيار الملف.
analyzeBtn.disabled = false;

async function ensureLetterTemplate() {
  if (!letterTemplateHtml) {
    letterTemplateHtml = await loadTemplate();
  }
}

function resetUI() {
  errorMessage.textContent = "";
  resultsArea.textContent = "لم يتم بعد بدء التحليل.";
  summaryChip.textContent = "لم يبدأ التحليل";
  mappingArea.innerHTML = "";
}

function setFileError(msg) {
  errorMessage.textContent = msg;
  selectedFile = null;
  analyzeBtn.disabled = true;
  fileInfo.textContent = "";
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

  matchState = matchRows(normalizedRows, dictionaries);
  matchState.warnings.push(...warnings);
  summarize(normalizedRows, matchState.warnings);
  renderPreview();
}

function renderPreview() {
  const preview = {
    autoMatched: matchState.autoMatched.slice(0, 5),
    needsReview: matchState.needsReview.slice(0, 5),
  };
  const pre = document.createElement("pre");
  pre.textContent = JSON.stringify(
    { preview, warnings: matchState.warnings },
    null,
    2
  );
  const summaryHtml = `
    <div class="pill">تعيين مكتمل</div>
    <div class="pill">مطابق تلقائي: ${matchState.autoMatched.length}</div>
    <div class="pill">يحتاج قرار: ${matchState.needsReview.length}</div>
    <button id="resolveBtn" ${matchState.needsReview.length ? "" : "disabled"}>حل الحالات المعلقة</button>
    <button id="previewLetterBtn" ${matchState.autoMatched.length ? "" : "disabled"}>معاينة خطاب</button>
  `;
  resultsArea.innerHTML = summaryHtml;
  resultsArea.appendChild(pre);

  const resolveBtn = document.getElementById("resolveBtn");
  const previewBtn = document.getElementById("previewLetterBtn");
  resolveBtn?.addEventListener("click", () => openDecisionModal());
  previewBtn?.addEventListener("click", () => openLetterModal());
}

function openModal(title, bodyBuilder, options = {}) {
  const { primaryLabel = "إغلاق", onPrimary, secondaryLabel, onSecondary } = options;
  modalTitle.textContent = title;
  modalBody.innerHTML = "";
  bodyBuilder(modalBody);
  modalPrimary.textContent = primaryLabel;
  modalPrimary.onclick = () => {
    onPrimary?.();
    closeModal();
  };
  if (secondaryLabel) {
    modalSecondary.textContent = secondaryLabel;
    modalSecondary.style.display = "inline-block";
    modalSecondary.onclick = () => {
      onSecondary?.();
      closeModal();
    };
  } else {
    modalSecondary.style.display = "none";
    modalSecondary.onclick = null;
  }
  modalClose.onclick = closeModal;
  modalOverlay.classList.add("open");
  modalOverlay.setAttribute("aria-hidden", "false");
}

function closeModal() {
  modalOverlay.classList.remove("open");
  modalOverlay.setAttribute("aria-hidden", "true");
}

function openDecisionModal() {
  if (!matchState.needsReview.length) {
    openModal("لا توجد حالات", (body) => {
      body.innerHTML = "<p class='muted'>لا يوجد صفوف تحتاج قرار.</p>";
    });
    return;
  }
  const item = matchState.needsReview[0];
  const bankOptions = getOfficialList(dictionaries, "banks")
    .map((b) => `<option value="${b.id}">${b.name}</option>`)
    .join("");
  const supplierOptions = getOfficialList(dictionaries, "suppliers")
    .map((s) => `<option value="${s.id}">${s.name}</option>`)
    .join("");
  openModal("حل حالة غامضة", (body) => {
    body.innerHTML = `
      <p class="muted">صف: ${item.rowIndex ?? "?"}</p>
      <div class="field-group">
        <div class="decision-field">
          <div class="muted">البنك الخام</div>
          <div>${item.bank_raw || "<فارغ>"}</div>
          <select id="bankSelect" class="mapping-select">
            <option value="">اختر بنكاً رسمياً</option>
            ${bankOptions}
          </select>
          <input id="bankNew" type="text" placeholder="أو أدخل بنكاً جديداً (عربي)" class="decision-input" />
        </div>
        <div class="decision-field">
          <div class="muted">المورد الخام</div>
          <div>${item.supplier_raw || "<فارغ>"}</div>
          <select id="supplierSelect" class="mapping-select">
            <option value="">اختر مورداً رسمياً</option>
            ${supplierOptions}
          </select>
          <input id="supplierNew" type="text" placeholder="أو أدخل مورداً جديداً" class="decision-input" />
        </div>
      </div>
      <p id="decisionError" class="error"></p>
    `;
    modalPrimary.textContent = "حفظ القرار";
    modalPrimary.onclick = () => {
      const bankSelect = body.querySelector("#bankSelect");
      const supplierSelect = body.querySelector("#supplierSelect");
      const bankNew = body.querySelector("#bankNew");
      const supplierNew = body.querySelector("#supplierNew");
      const errorEl = body.querySelector("#decisionError");
      let bankId = bankSelect?.value || "";
      let supplierId = supplierSelect?.value || "";

      if (!bankId && bankNew?.value.trim()) {
        dictionaries = addOfficial(dictionaries, "banks", bankNew.value.trim());
        const list = getOfficialList(dictionaries, "banks");
        bankId = list[list.length - 1]?.id || "";
      }
      if (!supplierId && supplierNew?.value.trim()) {
        dictionaries = addOfficial(dictionaries, "suppliers", supplierNew.value.trim());
        const list = getOfficialList(dictionaries, "suppliers");
        supplierId = list[list.length - 1]?.id || "";
      }
      if (!bankId || !supplierId) {
        if (errorEl) errorEl.textContent = "يجب تحديد بنك ومورد قبل الحفظ.";
        return;
      }
      addOrUpdateVariant(dictionaries, "banks", item.bank_raw, bankId);
      addOrUpdateVariant(dictionaries, "suppliers", item.supplier_raw, supplierId);
      saveDictionaries(dictionaries);

      const resolved = { ...item };
      resolved.bank_match = {
        matched: true,
        officialId: bankId,
        officialName: getOfficialNameById(dictionaries, "banks", bankId),
        confidence: 1,
      };
      resolved.supplier_match = {
        matched: true,
        officialId: supplierId,
        officialName: getOfficialNameById(dictionaries, "suppliers", supplierId),
        confidence: 1,
      };
      matchState.needsReview.shift();
      matchState.autoMatched.push(resolved);

      renderPreview();
      if (matchState.needsReview.length) {
        openDecisionModal();
      } else {
        closeModal();
      }
    };
  }, { primaryLabel: "حفظ القرار" });
}

async function openLetterModal() {
  if (!matchState.autoMatched.length) {
    openModal("لا توجد خطابات", (body) => {
      body.innerHTML = "<p class='muted'>لا توجد صفوف مطابقة لعرض خطاب.</p>";
    });
    return;
  }
  await ensureLetterTemplate();
  const firstRow = matchState.autoMatched[0];
  const html = renderLetter(
    {
      ...firstRow,
      sender_name: "اسم المرسل",
      sender_position: "الوظيفة",
      department_name: "الإدارة",
      hospital_name: "المستشفى",
    },
    letterTemplateHtml
  );
  openModal(
    "معاينة الخطاب",
    (body) => {
      const frame = document.createElement("iframe");
      frame.className = "letter-frame";
      frame.title = "معاينة الخطاب";
      frame.srcdoc = html;
      frame.id = "letterFrameModal";
      body.appendChild(frame);
    },
    {
      primaryLabel: "إغلاق",
      secondaryLabel: "طباعة / حفظ PDF",
      onSecondary: () => {
        const frameEl = document.getElementById("letterFrameModal");
        frameEl?.contentWindow?.focus();
        frameEl?.contentWindow?.print();
      },
    }
  );
}

excelInput.addEventListener("change", (e) => {
  resetUI();
  const file = e.target.files[0];

  if (!file) {
    setFileError("");
    return;
  }

  selectedFile = file;
  analyzeBtn.disabled = false;
  fileInfo.textContent = `الملف المختار: ${file.name} — الحجم: ${(file.size / 1024).toFixed(1)} KB`;

  const isXlsx = file.name.toLowerCase().includes("xlsx") || (file.type && file.type.includes("sheet"));
  if (!isXlsx) {
    errorMessage.textContent = "الملف قد لا يكون XLSX، سيتم المتابعة لكن يُفضل رفع ملف Excel صحيح.";
  }

  const maxSizeBytes = 20 * 1024 * 1024; // 20MB
  if (file.size > maxSizeBytes) {
    errorMessage.textContent = "تنبيه: حجم الملف يتجاوز 20MB. يفضل تقليل الصفوف، وسيتم المتابعة على مسؤوليتك.";
  }
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
