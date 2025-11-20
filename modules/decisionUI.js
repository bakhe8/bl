import { addOfficial, addOrUpdateVariant, getOfficialList, saveDictionaries } from "./dictionaryEngine.js";

export function renderDecisionUI(container, state, dictionaries, onResolve) {
  if (!container) return;
  const pending = state.needsReview;
  if (!pending.length) {
    container.innerHTML = `
      <div class="card-head">
        <div>
          <h2>حالات تحتاج قرار</h2>
          <p class="muted">لا توجد حالات معلقة حالياً.</p>
        </div>
      </div>
    `;
    return;
  }

  const item = pending[0];
  const bankOptions = getOfficialList(dictionaries, "banks")
    .map((b) => `<option value="${b.id}">${b.name}</option>`)
    .join("");
  const supplierOptions = getOfficialList(dictionaries, "suppliers")
    .map((s) => `<option value="${s.id}">${s.name}</option>`)
    .join("");

  container.innerHTML = `
    <div class="card-head">
      <div>
        <h2>حالات تحتاج قرار</h2>
        <p class="muted">حل الغموض للبنك/المورد. سيتم حفظ القرار فوراً (لا يوجد تراجع).</p>
      </div>
    </div>
    <div class="decision-block">
      <div class="muted">صف: ${item.rowIndex ?? "?"}</div>
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
      <div class="field-group">
        <button id="confirmDecision">حفظ القرار</button>
        <p id="decisionError" class="error"></p>
      </div>
    </div>
  `;

  const bankSelect = container.querySelector("#bankSelect");
  const supplierSelect = container.querySelector("#supplierSelect");
  const bankNew = container.querySelector("#bankNew");
  const supplierNew = container.querySelector("#supplierNew");
  const errorEl = container.querySelector("#decisionError");
  const confirmBtn = container.querySelector("#confirmDecision");

  confirmBtn.addEventListener("click", () => {
    errorEl.textContent = "";
    let bankId = bankSelect.value;
    let supplierId = supplierSelect.value;

    if (!bankId && bankNew.value.trim()) {
      dictionaries = addOfficial(dictionaries, "banks", bankNew.value.trim());
      bankId = getOfficialList(dictionaries, "banks").slice(-1)[0]?.id || "";
    }
    if (!supplierId && supplierNew.value.trim()) {
      dictionaries = addOfficial(dictionaries, "suppliers", supplierNew.value.trim());
      supplierId = getOfficialList(dictionaries, "suppliers").slice(-1)[0]?.id || "";
    }

    if (!bankId || !supplierId) {
      errorEl.textContent = "يجب تحديد بنك ومورد قبل الحفظ.";
      return;
    }

    // تحديث variants
    addOrUpdateVariant(dictionaries, "banks", item.bank_raw, bankId);
    addOrUpdateVariant(dictionaries, "suppliers", item.supplier_raw, supplierId);
    saveDictionaries(dictionaries);

    const resolved = { ...item };
    resolved.bank_match = {
      matched: true,
      officialId: bankId,
      officialName: getOfficialList(dictionaries, "banks").find((b) => b.id === bankId)?.name || "",
      confidence: 1,
    };
    resolved.supplier_match = {
      matched: true,
      officialId: supplierId,
      officialName:
        getOfficialList(dictionaries, "suppliers").find((s) => s.id === supplierId)?.name || "",
      confidence: 1,
    };

    // إزالة الحالة الحالية من القائمة
    state.needsReview.shift();
    state.autoMatched.push(resolved);

    onResolve?.(state, dictionaries);
  });
}
