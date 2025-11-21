import suppliersJson from "./dictionaries/suppliers.json";
import variantsJson from "./dictionaries/variants_suppliers.json";

export const SUPPLIERS_DICTIONARY = suppliersJson?.suppliers || [];
export const SUPPLIER_OPTIONS = SUPPLIERS_DICTIONARY.map((s) => s.official);
export const SUPPLIER_VARIANTS_SEEDED = variantsJson?.records || [];
export const SUPPLIER_VARIANTS_KEY = "bgl_supplier_variants";
