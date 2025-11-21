import React, { useEffect, useMemo, useState } from "react";
import { normalizeName } from "../logic/normalization";
import { fuzzyMatchScore } from "../logic/matching";

const DEBOUNCE_MS = 200;

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
    return suppliersCanonical
      .map((c) => {
        const normCanon = c.normalized || normalizeName(c.canonical);
        const aliases = c.normalizedAliases || [];
        const aliasScore = aliases.reduce((best, a) => Math.max(best, fuzzyMatchScore(normQ, a)), 0);
        const canonScore = fuzzyMatchScore(normQ, normCanon);
        const baseScore = Math.max(canonScore, aliasScore);
        const variantBoost = variantScoresByOfficial.get(c.canonical) || 0;
        const finalScore = Math.max(baseScore, variantBoost);
        return {
          official: c.canonical,
          score: finalScore,
          aliases: c.aliases || [],
        };
      })
      .filter((s) => s.score > 0.4)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [debouncedQuery, suppliersCanonical, variantScoresByOfficial]);

  const handleSelect = (official) => {
    onChange && onChange(official);
    setQuery(official);
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
      />
      {query && suggestions.length > 0 && (
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
          <div className="typeahead-item muted">+ إضافة مورد جديد (تدقيق عقود)</div>
        </div>
      )}
    </div>
  );
}
