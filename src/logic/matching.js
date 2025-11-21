import { normalizeName } from "./normalization";

const simpleSimilarity = (a, b) => {
  if (!a || !b) return 0;
  const s1 = a;
  const s2 = b;
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1;
  let same = 0;
  for (let i = 0; i < Math.min(s1.length, s2.length); i++) {
    if (s1[i] === s2[i]) same++;
  }
  return same / maxLen;
};

export const resolveBank = (raw, officialBanks, variantsDict = {}, fuzzyThreshold = 0.9) => {
  if (!raw || !String(raw).trim()) return { status: "manual", official: null, fuzzySuggestion: null };
  const normalizedRaw = normalizeName(raw);

  // 0) محاولات alias محلية (لا تضيف بنك جديد، تربط الخام إلى اسم رسمي موجود)
  const bankAlias = variantsDict[normalizedRaw];
  if (bankAlias) {
    const officialName = typeof bankAlias === "string" ? bankAlias : bankAlias.official;
    if (officialName) return { status: "auto", official: officialName, fuzzySuggestion: null };
  }

  const normalizedOfficial = officialBanks.map((b) => ({
    name: b.official,
    normalized: normalizeName(b.official),
    aliases: (b.short || []).map((a) => normalizeName(a)),
  }));

  const exactOfficial = normalizedOfficial.find((b) => b.normalized === normalizedRaw);
  if (exactOfficial) return { status: "auto", official: exactOfficial.name, fuzzySuggestion: null };

  const aliasHit = normalizedOfficial.find((b) => b.aliases.includes(normalizedRaw));
  if (aliasHit) return { status: "auto", official: aliasHit.name, fuzzySuggestion: null };

  let best = { score: 0, name: null };
  for (const b of normalizedOfficial) {
    const score = simpleSimilarity(normalizedRaw, b.normalized);
    if (score > best.score) best = { score, name: b.name };
  }
  if (best.name && best.score >= fuzzyThreshold) {
    return { status: "auto", official: best.name, fuzzySuggestion: best.name };
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
    return { status: "auto", official: normalizedOfficialMap.get(normalizedRaw), fuzzySuggestion: null };
  }

  const variantRaw = variantsDict[normalizedRaw];
  const variantHit =
    typeof variantRaw === "string"
      ? { official: variantRaw, occurrences: 1, confirmed: false }
      : variantRaw;
  if (variantHit) {
    // أي variant سبق الموافقة عليه يعتمد مباشرة (حتى لو لم يصل 3 مرات) لضمان ظهور الاسم العربي
    return { status: "auto", official: variantHit.official, fuzzySuggestion: null };
  }

  let best = { score: 0, official: null };
  for (const official of officialList) {
    const score = simpleSimilarity(normalizedRaw, normalizeName(official));
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
