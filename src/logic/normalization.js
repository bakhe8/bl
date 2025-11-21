const AR_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const AR_TATWEEL = /\u0640/g;
const AR_EASTERN_DIGITS = /[٠-٩]/g;

const normalizeArabicDigits = (text) =>
  text.replace(AR_EASTERN_DIGITS, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

const normalizeArabicShapes = (text) =>
  text
    .replace(/[\u0622\u0623\u0625\u0671]/g, "ا")
    .replace(/\u0629/g, "ه")
    .replace(/\u0649/g, "ي")
    .replace(/\u0626/g, "ي")
    .replace(/\u0624/g, "و");

export const normalizeName = (input) => {
  if (!input) return "";
  let s = String(input).trim();

  try {
    s = s.normalize("NFKC");
  } catch {
    // بعض البيئات لا تدعم normalize — نتجاهل
  }

  s = normalizeArabicShapes(s);
  s = s.replace(AR_DIACRITICS, "");
  s = s.replace(AR_TATWEEL, "");
  s = normalizeArabicDigits(s);

  // فواصل/نقاط/شرطات → مسافة
  s = s.replace(/[\.،,:;\/\\\-–—]+/g, " ");

  s = s.toLowerCase();
  s = s.replace(/\s+/g, " ");
  return s.trim();
};

export const normalizeKey = (key) =>
  String(key || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/gi, " ")
    .replace(/\s+/g, " ");

export const formatDateValue = (value) => {
  if (value === null || value === undefined || value === "") return "";
  const num = Number(value);
  let dateObj = null;
  if (!Number.isNaN(num) && num > 59) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    dateObj = new Date(excelEpoch.getTime() + num * 86400 * 1000);
  } else {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      dateObj = parsed;
    }
  }
  if (!dateObj) return String(value);
  try {
    return (
      new Intl.DateTimeFormat("ar-SA", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(dateObj) + "م"
    );
  } catch {
    return dateObj.toISOString().split("T")[0];
  }
};
