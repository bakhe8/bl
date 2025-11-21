import banksJson from "./dictionaries/banks.json";

export const BANK_DICTIONARY = banksJson?.banks || [];
export const BANK_OPTIONS = BANK_DICTIONARY.map((b) => b.official);
