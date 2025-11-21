import { normalizeName } from "./normalization";

const jaroDistance = (s1Raw, s2Raw) => {
  const s1 = s1Raw || "";
  const s2 = s2Raw || "";
  if (s1 === s2) return 1;
  const len1 = s1.length;
  const len2 = s2.length;
  if (!len1 || !len2) return 0;

  const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1;
  const s1Matches = new Array(len1).fill(false);
  const s2Matches = new Array(len2).fill(false);

  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, len2);
    for (let j = start; j < end; j++) {
      if (s2Matches[j]) continue;
      if (s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (!matches) return 0;

  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }
  transpositions /= 2;

  return (
    (matches / len1 + matches / len2 + (matches - transpositions) / matches) /
    3
  );
};

const jaroWinkler = (aRaw, bRaw, p = 0.1, maxPrefix = 4) => {
  const a = aRaw || "";
  const b = bRaw || "";
  if (!a.length || !b.length) return 0;
  const j = jaroDistance(a, b);
  let prefix = 0;
  const max = Math.min(maxPrefix, a.length, b.length);
  for (let i = 0; i < max && a[i] === b[i]; i++) prefix++;
  return j + prefix * p * (1 - j);
};

const fuzzySimilarity = (normalizedA, normalizedB) =>
  jaroWinkler(normalizedA, normalizedB);

const asVariantRecord = (rawVariant) => {
  if (!rawVariant) return null;
  if (typeof rawVariant === "string") {
    return {
      official: rawVariant,
      occurrences: 1,
      confirmed: false,
      manualCount: 0,
      autoCount: 0,
      score: 0,
      status: null,
    };
  }
  return {
    official: rawVariant.official,
    occurrences: rawVariant.occurrences || 1,
    confirmed: Boolean(rawVariant.confirmed),
    manualCount: rawVariant.manualCount || 0,
    autoCount: rawVariant.autoCount || 0,
    score: typeof rawVariant.score === "number" ? rawVariant.score : 0,
    status: rawVariant.status || (rawVariant.confirmed ? "confirmed" : null),
  };
};

export const resolveBank = (
  raw,
  officialBanks,
  variantsDict = {},
  fuzzyConfigOrThreshold = 0.9
) => {
  if (!raw || !String(raw).trim()) {
    return { status: "manual", official: null, fuzzySuggestion: null };
  }
  const normalizedRaw = normalizeName(raw);

  const config =
    typeof fuzzyConfigOrThreshold === "number"
      ? { fuzzyAuto: fuzzyConfigOrThreshold, fuzzySuggest: Math.min(fuzzyConfigOrThreshold, 0.85) }
      : {
          fuzzyAuto: fuzzyConfigOrThreshold.fuzzyAuto ?? 0.9,
          fuzzySuggest: fuzzyConfigOrThreshold.fuzzySuggest ?? 0.85,
        };

  const normalizedOfficial = officialBanks.map((b) => ({
    name: b.official,
    normalized: normalizeName(b.official),
    aliases: (b.short || []).map((a) => normalizeName(a)),
  }));

  const exactOfficial = normalizedOfficial.find((b) => b.normalized === normalizedRaw);
  if (exactOfficial) {
    return {
      status: "auto",
      official: exactOfficial.name,
      fuzzySuggestion: null,
      probability: 1,
      source: "official-exact",
    };
  }

  const aliasHit = normalizedOfficial.find((b) => b.aliases.includes(normalizedRaw));
  if (aliasHit) {
    return {
      status: "auto",
      official: aliasHit.name,
      fuzzySuggestion: null,
      probability: 0.98,
      source: "alias-exact",
    };
  }

  let best = { score: 0, name: null };
  for (const b of normalizedOfficial) {
    const score = fuzzySimilarity(normalizedRaw, b.normalized);
    if (score > best.score) best = { score, name: b.name };
  }

  if (best.name && best.score >= config.fuzzyAuto) {
    return {
      status: "auto",
      official: best.name,
      fuzzySuggestion: best.name,
      probability: best.score,
      source: "official-fuzzy-auto",
    };
  }
  if (best.name && best.score >= config.fuzzySuggest) {
    return {
      status: "fuzzy",
      official: null,
      fuzzySuggestion: best.name,
      probability: best.score,
      source: "official-fuzzy-suggest",
    };
  }

  return { status: "manual", official: null, fuzzySuggestion: null };
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
  const normalizedOfficialMap = new Map(officialList.map((o) => [normalizeName(o), o]));

  if (normalizedOfficialMap.has(normalizedRaw)) {
    return {
      status: "auto",
      official: normalizedOfficialMap.get(normalizedRaw),
      fuzzySuggestion: null,
      probability: 1,
      source: "official-exact",
    };
  }

  const variantRec = asVariantRecord(variantsDict[normalizedRaw]);
  if (variantRec) {
    const prob = variantRec.score || 0.95;
    if (variantRec.confirmed || prob >= 0.9 || variantRec.status === "permanent" || variantRec.status === "confirmed") {
      return {
        status: "auto",
        official: variantRec.official,
        fuzzySuggestion: null,
        probability: prob,
        source: "variant",
        learnStatus: variantRec.status || null,
      };
    }
    if (prob >= 0.6) {
      return {
        status: "fuzzy",
        official: null,
        fuzzySuggestion: variantRec.official,
        probability: prob,
        source: "variant",
        learnStatus: variantRec.status || null,
      };
    }
  }

  let best = { score: 0, official: null };
  for (const official of officialList) {
    const score = fuzzySimilarity(normalizedRaw, normalizeName(official));
    if (score > best.score) best = { score, official };
  }

  if (best.official && best.score >= fuzzyAuto) {
    return {
      status: "auto",
      official: best.official,
      fuzzySuggestion: best.official,
      probability: best.score,
      source: "official-fuzzy-auto",
    };
  }
  if (best.official && best.score >= fuzzySuggest) {
    return {
      status: "fuzzy",
      official: null,
      fuzzySuggestion: best.official,
      probability: best.score,
      source: "official-fuzzy-suggest",
    };
  }

  return { status: "manual", official: null, fuzzySuggestion: null };
};

export const fuzzyMatchScore = (a, b) =>
  fuzzySimilarity(normalizeName(a), normalizeName(b));
