import { normalizeName } from "./normalization";

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
  try {
    localStorage.setItem(key, JSON.stringify(updated));
  } catch {
    /* ignore */
  }
  return updated;
};

// دمج آمن دون المساس بالأسماء الرسمية: يدمج occurrences/confirmed ويحتفظ بالاسم الرسمي
export const mergeAliasDict = (current = {}, incoming = {}) => {
  const merged = { ...current };
  Object.entries(incoming).forEach(([k, v]) => {
    const existing = merged[k];
    if (!existing) {
      merged[k] = v;
    } else {
      const official =
        (typeof v === "string" ? v : v.official) || (typeof existing === "string" ? existing : existing.official);
      const occurrences =
        (existing?.occurrences || (typeof existing === "string" ? 1 : 1)) +
        (v?.occurrences || (typeof v === "string" ? 1 : 1));
      const confirmed = Boolean(
        (typeof existing === "object" && existing.confirmed) || (typeof v === "object" && v.confirmed) || occurrences >= 3
      );
      merged[k] = { official, occurrences, confirmed };
    }
  });
  return merged;
};
