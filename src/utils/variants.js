import { normalizeName } from "./normalize";

export const buildVariantDict = (records = [], officialLookup = {}) => {
  const dict = {};
  for (const r of records) {
    const official = r.official || officialLookup[r.officialId];
    if (!official) continue;
    const normalizedRaw = normalizeName(r.raw || r.clean);
    if (!normalizedRaw) continue;
    dict[normalizedRaw] = {
      official,
      occurrences: r.occurrences || 1,
      confirmed: Boolean(r.confirmed),
    };
  }
  return dict;
};

const upgradeVariantDict = (dict = {}) => {
  const out = {};
  for (const [k, v] of Object.entries(dict)) {
    if (typeof v === "string") {
      out[k] = { official: v, occurrences: 1, confirmed: false };
    } else {
      out[k] = {
        official: v.official,
        occurrences: v.occurrences || 1,
        confirmed: Boolean(v.confirmed),
      };
    }
  }
  return out;
};

export const loadVariants = (key, defaultRecords = [], officialLookup = {}) => {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      return upgradeVariantDict(parsed);
    }
    return buildVariantDict(defaultRecords, officialLookup);
  } catch {
    return buildVariantDict(defaultRecords, officialLookup);
  }
};

export const saveVariants = (key, dict) => {
  try {
    localStorage.setItem(key, JSON.stringify(dict));
  } catch {
    /* ignore */
  }
};

const exactMatch = (raw, variantsDict) => {
  const n = normalizeName(raw);
  if (!n) return null;
  return variantsDict[n] || null;
};

const simpleSimilarity = (a, b) => {
  if (!a || !b) return 0;
  const s1 = normalizeName(a);
  const s2 = normalizeName(b);
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1;
  let same = 0;
  for (let i = 0; i < Math.min(s1.length, s2.length); i++) {
    if (s1[i] === s2[i]) same++;
  }
  return same / maxLen;
};

const fuzzyMatch = (raw, variantsDict, threshold = 0.9) => {
  const keys = Object.keys(variantsDict);
  if (!keys.length) return null;
  let bestKey = null;
  let bestScore = 0;
  for (const key of keys) {
    const score = simpleSimilarity(raw, key);
    if (score > bestScore) {
      bestScore = score;
      bestKey = key;
    }
  }
  if (bestScore >= threshold) {
    return { key: bestKey, official: variantsDict[bestKey], score: bestScore };
  }
  return null;
};

export const resolveSupplierValue = (
  raw,
  variantsDict,
  officialList = [],
  { fuzzyAuto = 0.9, fuzzySuggest = 0.8 } = {}
) => {
  if (!raw || !String(raw).trim()) {
    return { status: "manual", official: null, fuzzySuggestion: null };
  }

  const normalizedRaw = normalizeName(raw);
  const normalizedOfficialMap = new Map(
    officialList.map((o) => [normalizeName(o), o])
  );

  // 1) Official exact
  if (normalizedOfficialMap.has(normalizedRaw)) {
    return { status: "auto", official: normalizedOfficialMap.get(normalizedRaw), fuzzySuggestion: null };
  }

  // 2) Variant lookup
  const variantRaw = variantsDict[normalizedRaw];
  const variantHit =
    typeof variantRaw === "string"
      ? { official: variantRaw, occurrences: 1, confirmed: false }
      : variantRaw;
  if (variantHit) {
    if (variantHit.confirmed || variantHit.occurrences >= 3) {
      return { status: "auto", official: variantHit.official, fuzzySuggestion: null };
    }
    return { status: "fuzzy", official: variantHit.official, fuzzySuggestion: variantHit.official };
  }

  // 3) Fuzzy vs official list
  let best = { score: 0, official: null };
  for (const [norm, official] of normalizedOfficialMap.entries()) {
    const score = simpleSimilarity(normalizedRaw, norm);
    if (score > best.score) best = { score, official };
  }

  if (best.official && best.score >= fuzzyAuto) {
    return { status: "auto", official: best.official, fuzzySuggestion: best.official };
  }
  if (best.official && best.score >= fuzzySuggest) {
    return { status: "fuzzy", official: null, fuzzySuggestion: best.official };
  }

  return { status: "manual", official: null, fuzzySuggestion: null };
};

export const learnVariant = (raw, official, variantsDict, key) => {
  const n = normalizeName(raw);
  if (!n || !official) return variantsDict;
  const existingRaw = variantsDict[n];
  const existing =
    typeof existingRaw === "string"
      ? { official: existingRaw, occurrences: 1, confirmed: false }
      : existingRaw;
  const occurrences = existing ? (existing.occurrences || 1) + 1 : 1;
  const updated = {
    ...variantsDict,
    [n]: {
      official,
      occurrences,
      confirmed: existing ? existing.confirmed || occurrences >= 3 : occurrences >= 3,
    },
  };
  saveVariants(key, updated);
  return updated;
};
