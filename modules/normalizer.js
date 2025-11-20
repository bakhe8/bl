const ARABIC_PUNCT = /[ـ]+/g;
const COMMON_PUNCT = /[.,_\/\-]+/g;

function normalizeText(value) {
  if (typeof value !== "string") return value;
  let v = value.trim();
  // collapse spaces
  v = v.replace(/\s+/g, " ");
  // Arabic-specific cleanup
  v = v.replace(ARABIC_PUNCT, "");
  // leave words like شركة/بنك/مصرف كما هي (لا حذف للمعنى)
  // English cleanup: lowercase and remove extra punctuation when not between digits
  const isEnglish = /[a-zA-Z]/.test(v) && !/[اأإآء-ي]/.test(v);
  if (isEnglish) {
    v = v.toLowerCase();
    v = v.replace(COMMON_PUNCT, " ");
    v = v.replace(/\s+/g, " ");
  }
  return v.trim();
}

export function normalizeRows(rows) {
  return rows.map((row) => {
    const normalized = {};
    for (const [key, value] of Object.entries(row)) {
      if (typeof value === "string") {
        normalized[key] = normalizeText(value);
      } else {
        normalized[key] = value;
      }
    }
    return normalized;
  });
}
