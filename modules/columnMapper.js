export const REQUIRED_FIELDS = [
  "bank_raw",
  "supplier_raw",
  "guarantee_no",
  "contract_no",
  "amount_raw",
  "renewal_date_raw",
];

// مرادفات الأعمدة المدعومة
const FIELD_SYNONYMS = {
  bank_raw: ["bank", "bank name", "اسم البنك", "البنك"],
  supplier_raw: ["supplier", "vendor", "اسم المورد", "المورد", "المتعهد"],
  guarantee_no: ["guarantee no", "guarantee", "bond no", "bond_no", "رقم الضمان"],
  contract_no: ["contract", "contract no", "رقم العقد"],
  amount_raw: ["amount", "value", "المبلغ"],
  renewal_date_raw: ["date", "expiry", "renewal", "تاريخ الانتهاء", "expiry date"],
};

const MAPPING_KEY = "gl_mapping_v1";

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ");
}

export function loadStoredMapping() {
  try {
    const raw = localStorage.getItem(MAPPING_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveMapping(mapping) {
  try {
    localStorage.setItem(MAPPING_KEY, JSON.stringify(mapping));
  } catch {
    // تجاهل في حال تجاوز السعة
  }
}

// اكتشاف التعيين بناءً على المرادفات مع اعتماد المخزن إذا كان صالحاً
export function detectMapping(headers, storedMapping = {}) {
  const mapping = {};
  const normalizedHeaders = headers.map((h) => ({ original: h, norm: normalizeHeader(h) }));

  REQUIRED_FIELDS.forEach((field) => {
    // أولوية للمخزن إذا كان العمود موجوداً
    const stored = storedMapping[field];
    if (stored && headers.includes(stored)) {
      mapping[field] = stored;
      return;
    }
    // البحث بالمرادفات
    const synonyms = FIELD_SYNONYMS[field] || [];
    const match = normalizedHeaders.find((h) => synonyms.includes(h.norm));
    mapping[field] = match ? match.original : "";
  });

  return mapping;
}

export function applyMapping(rawRows, mapping) {
  const warnings = [];
  const rows = rawRows.map((row, idx) => {
    const mapped = {};
    REQUIRED_FIELDS.forEach((logical) => {
      const header = mapping[logical];
      if (header && row.hasOwnProperty(header)) {
        mapped[logical] = row[header];
      } else {
        mapped[logical] = "";
      }
    });
    const missing = REQUIRED_FIELDS.filter((f) => !mapped[f] || String(mapped[f]).trim() === "");
    if (missing.length) {
      warnings.push(`صف ${idx + 2}: حقول ناقصة ${missing.join(", ")}`);
    }
    return mapped;
  });
  return { rows, warnings };
}
