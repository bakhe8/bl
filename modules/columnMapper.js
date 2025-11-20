const REQUIRED_FIELDS = [
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
  guarantee_no: ["guarantee no", "guarantee", "bond_no", "رقم الضمان"],
  contract_no: ["contract", "contract no", "رقم العقد"],
  amount_raw: ["amount", "value", "المبلغ"],
  renewal_date_raw: ["date", "expiry", "renewal", "تاريخ الانتهاء", "expiry date"],
};

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ");
}

export function mapColumns(rawRows) {
  const warnings = [];
  if (!rawRows.length) return { rows: [], warnings };

  const headers = Object.keys(rawRows[0] || {}).map((h) => ({
    original: h,
    norm: normalizeHeader(h),
  }));

  const headerToField = {};
  headers.forEach(({ original, norm }) => {
    for (const [field, synonyms] of Object.entries(FIELD_SYNONYMS)) {
      if (synonyms.includes(norm)) {
        headerToField[original] = field;
        break;
      }
    }
  });

  const mappedRows = rawRows.map((row, idx) => {
    const mapped = {};
    for (const [key, value] of Object.entries(row)) {
      const target = headerToField[key];
      if (target) {
        mapped[target] = value;
      }
    }
    REQUIRED_FIELDS.forEach((field) => {
      if (!(field in mapped)) mapped[field] = "";
    });
    // تنبيه إذا لم تُكتشف أعمدة مطلوبة
    const missing = REQUIRED_FIELDS.filter((f) => !mapped[f] || String(mapped[f]).trim() === "");
    if (missing.length) {
      warnings.push(`صف ${idx + 2}: حقول ناقصة ${missing.join(", ")}`);
    }
    return mapped;
  });

  const unmappedFields = REQUIRED_FIELDS.filter(
    (field) => !Object.values(headerToField).includes(field)
  );
  if (unmappedFields.length) {
    warnings.push(`ملحوظة: لم يتم العثور على أعمدة مطابقة لـ: ${unmappedFields.join(", ")}`);
  }

  return { rows: mappedRows, warnings };
}
