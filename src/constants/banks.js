import banksJson from "../data/dictionaries/banks.json";
import { normalizeName } from "../logic/normalization";

export const BANK_DICTIONARY = banksJson?.banks || [];
export const BANK_OPTIONS = BANK_DICTIONARY.map((b) => b.official);
export const BANK_VARIANTS_KEY = "bgl_bank_aliases";

// Map of normalized shortcut/official for quick lookup if needed
export const BANK_NORMALIZED = BANK_DICTIONARY.map((b) => ({
  name: b.official,
  normalized: normalizeName(b.official),
  short: (b.short || []).map((s) => normalizeName(s)),
}));
