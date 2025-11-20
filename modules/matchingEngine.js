import { normalizeText } from "./dictionaryEngine.js";

const ACCEPT_THRESHOLD = 0.85;
const REVIEW_THRESHOLD = 0.7;

function similarity(a, b) {
  // Levenshtein-based similarity normalized to [0,1]
  const s1 = normalizeText(a);
  const s2 = normalizeText(b);
  if (!s1 || !s2) return 0;
  const len1 = s1.length;
  const len2 = s2.length;
  const dp = Array.from({ length: len1 + 1 }, () => Array(len2 + 1).fill(0));
  for (let i = 0; i <= len1; i++) dp[i][0] = i;
  for (let j = 0; j <= len2; j++) dp[0][j] = j;
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  const dist = dp[len1][len2];
  const maxLen = Math.max(len1, len2);
  const sim = maxLen === 0 ? 0 : 1 - dist / maxLen;
  return sim;
}

function matchField(raw, type, dict) {
  const result = {
    raw,
    matched: false,
    officialId: null,
    officialName: "",
    confidence: 0,
    needsReview: false,
    suggestions: [],
  };
  if (!raw) {
    result.needsReview = true;
    return result;
  }
  const officialList = dict.official?.[type] || [];
  const normRaw = normalizeText(raw);

  // exact official
  const exact = officialList.find((o) => normalizeText(o.name) === normRaw);
  if (exact) {
    result.matched = true;
    result.officialId = exact.id;
    result.officialName = exact.name;
    result.confidence = 1;
    return result;
  }

  // variants
  const variant = dict.variants?.find(
    (v) => v.type === type && normalizeText(v.raw) === normRaw && v.officialId
  );
  if (variant) {
    const official = officialList.find((o) => o.id === variant.officialId);
    if (official) {
      result.matched = true;
      result.officialId = official.id;
      result.officialName = official.name;
      result.confidence = variant.confirmed ? 1 : 0.85;
      return result;
    }
  }

  // fuzzy suggestions
  let best = { sim: 0, candidate: null };
  officialList.forEach((o) => {
    const sim = similarity(raw, o.name);
    if (sim > best.sim) best = { sim, candidate: o };
  });

  if (best.candidate && best.sim >= ACCEPT_THRESHOLD) {
    result.matched = true;
    result.officialId = best.candidate.id;
    result.officialName = best.candidate.name;
    result.confidence = best.sim;
    return result;
  }

  if (best.candidate && best.sim >= REVIEW_THRESHOLD) {
    result.needsReview = true;
    result.suggestions.push({
      id: best.candidate.id,
      name: best.candidate.name,
      similarity: best.sim,
    });
    return result;
  }

  // no match
  result.needsReview = true;
  return result;
}

export function matchRows(rows, dict) {
  const autoMatched = [];
  const needsReview = [];
  const warnings = [];

  rows.forEach((row, idx) => {
    const bank = matchField(row.bank_raw, "banks", dict);
    const supplier = matchField(row.supplier_raw, "suppliers", dict);

    if (bank.matched && supplier.matched) {
      autoMatched.push({
        ...row,
        bank_match: bank,
        supplier_match: supplier,
      });
    } else {
      needsReview.push({
        ...row,
        bank_match: bank,
        supplier_match: supplier,
        rowIndex: idx + 2, // considering header row
      });
    }
  });

  if (!dict.official?.banks?.length) warnings.push("القاموس الرسمي للبنوك فارغ.");
  if (!dict.official?.suppliers?.length) warnings.push("القاموس الرسمي للموردين فارغ.");

  return { autoMatched, needsReview, warnings };
}
