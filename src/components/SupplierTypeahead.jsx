import React, { useEffect, useMemo, useState } from "react";
import { normalizeName } from "../logic/normalization";
import { fuzzyMatchScore } from "../logic/matching";

const DEBOUNCE_MS = 200;
const BLUR_DELAY_MS = 120;

export function SupplierTypeahead({
  value,
  onChange,
  supplierVariants = {},
  suppliersCanonical = [],
  placeholder = "اكتب اسم المورد أو اختَر من الاقتراحات",
  disabled = false,
}) {
  const [query, setQuery] = useState(value || "");
  const [debouncedQuery, setDebouncedQuery] = useState(value || "");
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setQuery(value || "");
    setDebouncedQuery(value || "");
  }, [value]);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query]);

  const variantScoresByOfficial = useMemo(() => {
    const map = new Map();
    Object.values(supplierVariants || {}).forEach((v) => {
      if (!v?.official) return;
      const prev = map.get(v.official) || 0;
      // نستخدم score إن وجد، وإلا زيادة طفيفة حسب التكرار
      const candidate = typeof v.score === "number" ? v.score : Math.min(0.5 + (v.occurrences || 0) * 0.1, 0.95);
      map.set(v.official, Math.max(prev, candidate));
    });
    return map;
  }, [supplierVariants]);

  const suggestions = useMemo(() => {
    if (!debouncedQuery) return [];
    const normQ = normalizeName(debouncedQuery);
    if (!normQ) return [];
    const isArabic = (text) => /[\u0600-\u06FF]/.test(text || "");
    const normCurrent = normalizeName(value || "");

    // نحسب الترشيحات لكل سجل، ثم ندمج التكرارات بنفس الاسم الرسمي ونأخذ أعلى درجة
    const prelim = suppliersCanonical
      .map((c) => {
        const normCanon = c.normalized || normalizeName(c.canonical);
        const aliases = c.normalizedAliases || [];
        const aliasScore = aliases.reduce((best, a) => Math.max(best, fuzzyMatchScore(normQ, a)), 0);
        const canonScore = fuzzyMatchScore(normQ, normCanon);
        // نعطي أفضلية طفيفة للتطابق مع الاسم الرسمي العربي مقابل alias إنجليزي
        const weightedCanon = canonScore + 0.08; // دفعة للأسماء الرسمية
        const weightedAlias = aliasScore * 0.95;
        const baseScore = Math.max(weightedCanon, weightedAlias);
        const variantBoost = variantScoresByOfficial.get(c.canonical) || 0;
        // إذا كان المستخدم اختار هذا المورد سابقاً (value الحالي)، نعطيه دفعة إضافية ليكون أعلى ترتيباً
        const selectionBoost = normCurrent && normCurrent === normCanon ? 0.35 : 0;
        const finalScore = Math.max(baseScore, variantBoost) + selectionBoost;
        return {
          official: c.canonical,
          score: finalScore,
          aliases: c.aliases || [],
          isArabicOfficial: isArabic(c.canonical),
        };
      })
      .filter((s) => s.score > 0.4)
      .sort((a, b) => {
        const delta = b.score - a.score;
        if (Math.abs(delta) > 1e-4) return delta;
        if (a.isArabicOfficial !== b.isArabicOfficial) return a.isArabicOfficial ? -1 : 1;
        return a.official.localeCompare(b.official, "ar");
      });

    const dedup = new Map();
    prelim.forEach((s) => {
      if (!dedup.has(s.official)) {
        dedup.set(s.official, s);
      } else {
        const prev = dedup.get(s.official);
        if (s.score > prev.score) dedup.set(s.official, s);
      }
    });

    return Array.from(dedup.values())
      .sort((a, b) => {
        const delta = b.score - a.score;
        if (Math.abs(delta) > 1e-4) return delta;
        if (a.isArabicOfficial !== b.isArabicOfficial) return a.isArabicOfficial ? -1 : 1;
        return a.official.localeCompare(b.official, "ar");
      })
      .slice(0, 10);
  }, [debouncedQuery, suppliersCanonical, variantScoresByOfficial]);

  const handleSelect = (official) => {
    onChange && onChange(official);
    setQuery(official);
    setDebouncedQuery(official);
    setIsFocused(false);
  };

  const handleAddNew = () => {
    const val = (query || "").trim();
    if (!val) return;
    handleSelect(val);
  };

  return (
    <div className="typeahead">
      <input
        type="text"
        className="mapping-select"
        value={query}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange && onChange(e.target.value);
        }}
        disabled={disabled}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), BLUR_DELAY_MS)}
      />
      {isFocused && (query || suggestions.length > 0) && (
        <div className="typeahead-list">
          {suggestions.map((s) => (
            <button key={s.official} type="button" className="typeahead-item" onClick={() => handleSelect(s.official)}>
              <div className="typeahead-main">
                <span className="typeahead-title">{s.official}</span>
                <span className="prob-label">{Math.round(s.score * 100)}%</span>
              </div>
              {s.aliases && s.aliases.length ? (
                <div className="typeahead-aliases">أسماء مرتبطة: {s.aliases.slice(0, 3).join(" • ")}</div>
              ) : null}
            </button>
          ))}
          <button type="button" className="typeahead-item muted" onClick={handleAddNew}>
            + إضافة مورد جديد (تدقيق عقود)
          </button>
        </div>
      )}
    </div>
  );
}
