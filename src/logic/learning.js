import { normalizeName } from "./normalization";
import { fuzzyMatchScore } from "./matching";

const isRandomName = (value) => {
  const norm = normalizeName(value);
  const compact = norm.replace(/\s+/g, "");
  if (compact.length < 3) return true;
  const letters = compact.match(/[a-z\u0600-\u06ff]/gi) || [];
  const symbols = compact.length - letters.length;
  return symbols / Math.max(compact.length, 1) > 0.4;
};

const statusFrom = (occurrences, score, confirmedFlag) => {
  if (occurrences >= 4 || score >= 0.96) return "permanent";
  if (confirmedFlag || score >= 0.92 || occurrences >= 3) return "confirmed";
  if (occurrences === 2) return "semi";
  return "tentative";
};

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
      manualCount: r.manualCount || (r.confirmed ? 1 : 0),
      autoCount: r.autoCount || 0,
      score: r.score || 0.9,
      lastSeenAt: r.lastSeenAt || null,
      status: r.status || statusFrom(r.occurrences || 1, r.score || 0.9, Boolean(r.confirmed)),
    };
  }
  return dict;
};

const upgradeVariantDict = (dict = {}) => {
  const out = {};
  for (const [k, v] of Object.entries(dict)) {
    if (typeof v === "string") {
      out[k] = {
        official: v,
        occurrences: 1,
        confirmed: false,
        manualCount: 0,
        autoCount: 0,
        score: 0,
        lastSeenAt: null,
        status: "tentative",
      };
    } else {
      out[k] = {
        official: v.official,
        occurrences: v.occurrences || 1,
        confirmed: Boolean(v.confirmed),
        manualCount: v.manualCount || 0,
        autoCount: v.autoCount || 0,
        score:
          typeof v.score === "number"
            ? v.score
            : v.confirmed
            ? 0.95
            : 0,
        lastSeenAt: v.lastSeenAt || null,
        status:
          v.status ||
          statusFrom(
            v.occurrences || 1,
            typeof v.score === "number" ? v.score : 0,
            Boolean(v.confirmed)
          ),
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

export const computeVariantScore = ({
  similarity = 1,
  occurrences = 1,
  manualCount = 0,
  autoCount = 0,
}) => {
  const occBoost = 1 - Math.exp(-0.3 * occurrences);
  const manualBoost = manualCount > 0 ? 0.15 : 0;
  const autoBoost = Math.min(autoCount * 0.03, 0.15);

  let score = 0.6 * similarity + 0.3 * occBoost + manualBoost + autoBoost;
  if (score > 1) score = 1;
  if (score < 0) score = 0;
  return Number(score.toFixed(3));
};

export const learnVariant = (
  raw,
  official,
  variantsDict,
  key,
  options = {}
) => {
  const n = normalizeName(raw);
  if (!n || !official || isRandomName(n)) return variantsDict;
  const existingRaw = variantsDict[n];
  const existing =
    typeof existingRaw === "string"
      ? {
          official: existingRaw,
          occurrences: 1,
          confirmed: false,
          manualCount: 0,
          autoCount: 0,
          score: 0,
          lastSeenAt: null,
        }
      : existingRaw || null;

  const source = options.source || "manual";
  const isManual = source === "manual";

  const occurrences = (existing?.occurrences || 0) + 1;
  const manualCount = (existing?.manualCount || 0) + (isManual ? 1 : 0);
  const autoCount = (existing?.autoCount || 0) + (!isManual ? 1 : 0);

  const similarity =
    typeof options.similarityHint === "number"
      ? options.similarityHint
      : fuzzyMatchScore(n, normalizeName(official)) || 1;

  const score = computeVariantScore({
    similarity,
    occurrences,
    manualCount,
    autoCount,
  });

  const confirmed =
    existing?.confirmed || isManual || score >= 0.92 || occurrences >= 3;

  const status = statusFrom(occurrences, score, confirmed);

  const updated = {
    ...variantsDict,
    [n]: {
      official,
      occurrences,
      confirmed,
      manualCount,
      autoCount,
      score,
      lastSeenAt: new Date().toISOString(),
      status,
    },
  };
  saveVariants(key, updated);
  return updated;
};

export const mergeAliasDict = (current = {}, incoming = {}) => {
  const merged = { ...upgradeVariantDict(current) };
  const incomingUp = upgradeVariantDict(incoming);

  Object.entries(incomingUp).forEach(([k, v]) => {
    const existing = merged[k];
    if (!existing) {
      merged[k] = v;
    } else {
      const official =
        v.official || existing.official || v.official;

      const occurrences =
        (existing.occurrences || 1) + (v.occurrences || 1);
      const manualCount =
        (existing.manualCount || 0) + (v.manualCount || 0);
      const autoCount =
        (existing.autoCount || 0) + (v.autoCount || 0);

      const similarity = 1;
      const score = Math.max(
        existing.score || 0,
        v.score || 0,
        computeVariantScore({ similarity, occurrences, manualCount, autoCount })
      );

      const confirmed =
        existing.confirmed ||
        v.confirmed ||
        score >= 0.92 ||
        occurrences >= 3;

      const status = statusFrom(occurrences, score, confirmed);

      merged[k] = {
        official,
        occurrences,
        manualCount,
        autoCount,
        score,
        confirmed,
        lastSeenAt: existing.lastSeenAt || v.lastSeenAt || null,
        status,
      };
    }
  });

  return merged;
};

export const createLearningEngine = ({
  storageKey,
  defaultRecords = [],
  officialLookup = {},
  entityType = "generic",
} = {}) => {
  let dict = loadVariants(storageKey, defaultRecords, officialLookup);

  return {
    getAll: () => dict,
    getForRaw: (raw) => dict[normalizeName(raw)] || null,
    learnManual: (raw, official) => {
      dict = learnVariant(raw, official, dict, storageKey, { source: "manual" });
      return dict;
    },
    learnAuto: (raw, official, similarityHint) => {
      dict = learnVariant(raw, official, dict, storageKey, {
        source: "auto",
        similarityHint,
      });
      return dict;
    },
    exportSnapshot: () => ({
      storageKey,
      entityType,
      exportedAt: new Date().toISOString(),
      variants: dict,
    }),
  };
};
