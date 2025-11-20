const STORAGE_KEY = "gl_dictionaries_v1";

const DEFAULT_DICT = {
  schemaVersion: "1.0.0",
  official: {
    banks: [],
    suppliers: [],
  },
  variants: [],
};

function normalizeText(value) {
  if (typeof value !== "string") return "";
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[ـ]+/g, "")
    .replace(/[.,_\/\-]+/g, " ");
}

export function loadDictionaries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_DICT };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_DICT, ...parsed };
  } catch {
    return { ...DEFAULT_DICT };
  }
}

export function saveDictionaries(dict) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dict));
  } catch {
    // تجاهل في حال تجاوز السعة
  }
}

export function getOfficialList(dict, type) {
  return Array.isArray(dict.official?.[type]) ? dict.official[type] : [];
}

function findOfficialByName(dict, type, name) {
  const norm = normalizeText(name);
  return getOfficialList(dict, type).find((entry) => normalizeText(entry.name) === norm);
}

export function addOfficial(dict, type, name) {
  if (!name) return dict;
  if (!dict.official[type]) dict.official[type] = [];
  const existing = findOfficialByName(dict, type, name);
  if (existing) return dict;
  const id = `${type}_${dict.official[type].length + 1}`;
  dict.official[type].push({ id, name });
  return dict;
}

export function findVariant(dict, type, raw) {
  const norm = normalizeText(raw);
  return dict.variants.find(
    (v) => v.type === type && normalizeText(v.raw) === norm
  );
}

export function addOrUpdateVariant(dict, type, raw, officialId) {
  if (!raw || !officialId) return dict;
  const existing = findVariant(dict, type, raw);
  if (existing) {
    existing.count = (existing.count || 0) + 1;
    if (existing.count >= 3) existing.confirmed = true;
    return dict;
  }
  dict.variants.push({
    type,
    raw,
    rawNorm: normalizeText(raw),
    officialId,
    count: 1,
    confirmed: false,
  });
  return dict;
}

export function getOfficialNameById(dict, type, id) {
  return getOfficialList(dict, type).find((o) => o.id === id)?.name || "";
}

export { normalizeText };
