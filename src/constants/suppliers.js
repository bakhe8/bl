import suppliersJson from "../data/dictionaries/suppliers.json";
import variantsJson from "../data/dictionaries/variants_suppliers.json";
import suppliersCanonical from "../data/dictionaries/suppliers_canonical.json";

// القاموس الرسمي (قديم) للأسماء المعرّفة بالإدارات
export const SUPPLIERS_DICTIONARY = suppliersJson?.suppliers || [];

// القاموس الموحّد الجديد (canonical + aliases) المولّد من suppliers_upgrade
export const SUPPLIERS_CANONICAL = suppliersCanonical?.suppliers || [];

// قائمة الأسماء الرسمية (تُستخدم في القوائم المنسدلة والمطابقة)
export const SUPPLIER_OPTIONS =
  SUPPLIERS_CANONICAL.length > 0
    ? SUPPLIERS_CANONICAL.map((s) => s.canonical)
    : SUPPLIERS_DICTIONARY.map((s) => s.official);

// بذرة التعلم للموردين
export const SUPPLIER_VARIANTS_SEEDED = variantsJson?.records || [];

// lookup من id إلى official (للملفات القديمة)
export const SUPPLIER_OFFICIAL_LOOKUP = Object.fromEntries(
  SUPPLIERS_DICTIONARY.map((s) => [s.id, s.official])
);
