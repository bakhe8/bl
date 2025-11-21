import { normalizeName } from "./normalize";

export const resolveBank = (raw, officialBanks, fuzzyThreshold = 0.9) => {
  if (!raw || !String(raw).trim()) return { status: "manual", official: null, fuzzySuggestion: null };

  const normalizedRaw = normalizeName(raw);

  // Build lookup maps once
  const normalizedOfficial = officialBanks.map((b) => ({
    name: b.official,
    normalized: normalizeName(b.official),
    aliases: (b.short || []).map((a) => normalizeName(a)),
  }));

  // 1) Exact official match
  const exactOfficial = normalizedOfficial.find((b) => b.normalized === normalizedRaw);
  if (exactOfficial) {
    return { status: "auto", official: exactOfficial.name, fuzzySuggestion: null };
  }

  // 2) Exact alias match
  const aliasHit = normalizedOfficial.find((b) => b.aliases.includes(normalizedRaw));
  if (aliasHit) {
    return { status: "auto", official: aliasHit.name, fuzzySuggestion: null };
  }

  // 3) Fuzzy with official name
  let best = { score: 0, name: null };
  for (const b of normalizedOfficial) {
    const score = simpleSimilarity(normalizedRaw, b.normalized);
    if (score > best.score) best = { score, name: b.name };
  }

  if (best.name && best.score >= fuzzyThreshold) {
    // >=90% اعتبره مطابق آمن
    return { status: "auto", official: best.name, fuzzySuggestion: best.name };
  }
  return { status: "manual", official: null, fuzzySuggestion: null };
};

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
