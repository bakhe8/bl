export const normalizeName = (input) => {
  if (!input) return "";
  return String(input).toLowerCase().trim().replace(/\s+/g, " ").replace(/\./g, "");
};

export const simpleSimilarity = (a, b) => {
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
