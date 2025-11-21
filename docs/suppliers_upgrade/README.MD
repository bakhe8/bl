0. الهدف العام للمهمة

نبني طبقة Suppliers Engine مستقلة تقوم بـ:

تحميل وتجميع بيانات الموردين من الملفات الثلاثة.

تطبيع (Normalize) أسماء الموردين بالعربي/الإنجليزي.

إنشاء قاموس رسمي Canonical Suppliers Dictionary.

دمج معلومات التعلّم التاريخية من suppliers_index.json كـ aliases و counts.

توفير دالة واحدة رئيسية للمطابقة مثل:

resolveSupplier(rawName: string): {
  status: "auto" | "fuzzy" | "manual";
  official: string | null;
  probability: number;      // 0–1
  source: string;           // "canonical-exact" | "alias-exact" | "canonical-fuzzy" | "variants-fuzzy" | ...
  candidates?: Array<{ official: string; probability: number }>;
}


توفير دالة/طبقة تعلّم:

learnSupplier(rawName: string, officialName: string): void;


تُحدّث بها القاموس المتعلّم (variants) لاستخدامها في الملفات القادمة.

1. تحضير البيانات (Offline) من الملفات الثلاثة
1.1 قراءة الملفات

companies.json

يحتوي قائمة الموردين من النظام (الأسماء الرسمية كما تأتي من ERP/Contracts).

companies_cleaned.json

نفس القائمة بعد تنظيف (إزالة تكرار، تصحيح إملاء، توحيد صياغة).

suppliers_index.json

يحتوي:

canonical: الاسم الرسمي للمورد (كما استقر بعد المعالجة السابقة).

aliases: قائمة أسماء خام ظهرت في ملفات سابقة (Excel/خطابات).

count: عدد مرات ظهور المورد أو alias.

المطلوب: تجميع هذه الثلاثة في قاموس واحد للموردين.

1.2 نموذج البيانات المستهدف (Supplier Canonical Record)

نبغي الوصول إلى كائن بهذا الشكل:

type SupplierCanonical = {
  canonical: string;             // الاسم الرسمي النهائي بالعربية (أو الثابت)
  normalized: string;            // نتيجة normalizeName(canonical)
  aliases: string[];             // قائمة alias بالعربي/إنجليزي إلخ.
  normalizedAliases: string[];   // نفس aliases بعد normalizeName
  totalCount: number;            // مجمل مرات الظهور (من suppliers_index / النظام)
};

1.3 خطوات الدمج (Merge Logic)

ابدأ من companies_cleaned.json كـ مصدر أساس:

لكل اسم في هذا الملف:

أنشئ SupplierCanonical جديد:

{
  canonical: name,
  normalized: normalizeName(name),
  aliases: [],
  normalizedAliases: [],
  totalCount: 0
}


استخدم companies.json كـ مرجع إضافي/تحقّق:

لو هناك أسماء في companies.json غير موجودة في cleaned:

أضفها إلى القاموس بنفس البنية السابقة، أو سجّلها في log للمراجعة.

الآن اقرأ suppliers_index.json:

لكل عنصر فيه:

ابحث في القاموس عن record له normalized === normalizeName(canonical):

إن وجد:

أدمج aliases:

أضف كل alias إلى aliases إن لم يكن موجودًا.

احسب normalizedAliases = aliases.map(normalizeName).

أضف count إلى totalCount.

إن لم يوجد:

اعتبر هذا المورد جديدًا:

{
  canonical: item.canonical,
  normalized: normalizeName(item.canonical),
  aliases: item.aliases || [],
  normalizedAliases: (item.aliases || []).map(normalizeName),
  totalCount: item.count || 1
}


في النهاية احفظ الناتج في ملف جديد (مثلاً):
suppliers_canonical.json.

هذا الملف سيكون القاعدة الذهبية للموردين التي يستخدمها المحرك.

2. بناء طبقة التطبيع (normalization.js)
2.1 دالة normalizeName

أنشئ ملف مستقل مثلاً: src/logic/normalization.js يحتوي:

توحيد الحروف العربية (أ،إ،آ → ا / ة→ه / ى→ي إلخ).

إزالة التشكيل (الفتحة، الضمّة، إلخ).

إزالة التطويل (ـ).

إزالة الكلمات العامة للشركات (شركة، مؤسسة، ذ.م.م، للتجارة، المحدودة، …).

تحويل كل شيء إلى lowercase.

إزالة الفواصل والنقاط والرموز واستبدالها بمسافة واحدة.

دمج المسافات المتتالية إلى واحدة.

مثال بسيط (منطقي، عدّله حسب احتياجك):

const AR_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const AR_TATWEEL = /\u0640/g;

const COMPANY_STOPWORDS = [
  "شركة",
  "مؤسسة",
  "المحدودة",
  "ذ م م",
  "ذ.م.م",
  "ش ذ م م",
  "للتجارة",
  "للتجاره",
  "للتطوير",
  "للخدمات",
  "ال",
];

export function normalizeName(input) {
  if (input === null || input === undefined) return "";
  let s = String(input).trim();

  // Unicode normalize
  try {
    s = s.normalize("NFKC");
  } catch {}

  // إزالة التشكيل والتطويل
  s = s.replace(AR_DIACRITICS, "");
  s = s.replace(AR_TATWEEL, "");

  // توحيد أشكال الحروف العربية الأساسية
  s = s
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي");

  // إزالة كلمات الشركة العامة
  COMPANY_STOPWORDS.forEach((w) => {
    const re = new RegExp("\\b" + w + "\\b", "g");
    s = s.replace(re, " ");
  });

  // رموز عامة إلى مسافة
  s = s.replace(/[.,،:;_\/\\\-–—]+/g, " ");

  // إلى lowercase
  s = s.toLowerCase();

  // دمج المسافات
  s = s.replace(/\s+/g, " ");
  return s.trim();
}


هذه الدالة تُستخدم في كل مكان:

عند بناء القاموس

عند المطابقة

عند التعلّم

3. بناء محرك المطابقة (matching.js)
3.1 دالة حساب التشابه Fuzzy (مثلاً Jaro-Winkler)

إما تستخدم مكتبة، أو تكتب نسخة خفيفة. مثال بسيط:

function jaroDistance(s1, s2) {
  // (يمكن إعادة استخدام الكود الذي كتبتُه لك سابقاً)
  // اختصر هنا لأني أركز على التعليمات
}

function jaroWinkler(a, b, p = 0.1, maxPrefix = 4) {
  const j = jaroDistance(a, b);
  let prefix = 0;
  const max = Math.min(maxPrefix, a.length, b.length);
  for (let i = 0; i < max && a[i] === b[i]; i++) prefix++;
  return j + prefix * p * (1 - j);
}

// لمواءمة مع normalizeName:
export function fuzzyMatchScore(aRaw, bRaw) {
  const a = normalizeName(aRaw);
  const b = normalizeName(bRaw);
  if (!a || !b) return 0;
  return jaroWinkler(a, b);
}

3.2 دالة resolveSupplier

دالة (pure function) تأخذ:

rawName: string

canonicalList: SupplierCanonical[] (من suppliers_canonical.json)

variantsDict: Record<string, VariantRecord> (من التعلم)

وتعيد:

{
  status: "auto" | "fuzzy" | "manual";
  official: string | null;
  probability: number;
  source: string;
  candidates?: Array<{ official: string; probability: number }>;
}


المنطق:

Normalize raw:

const nRaw = normalizeName(rawName);


لو nRaw فارغ → manual.

جرّب التطابق المباشر مع canonical:

const candidateExact = canonicalList.find(
  (s) => s.normalized === nRaw
);
if (candidateExact) {
  return {
    status: "auto",
    official: candidateExact.canonical,
    probability: 1,
    source: "canonical-exact",
  };
}


جرّب التطابق مع aliases المتعلّمة (variantsDict – سأشرحه في قسم التعلم):

const vRecord = variantsDict[nRaw]; // لو موجود
if (vRecord && vRecord.confirmed && vRecord.score >= 0.9) {
  return {
    status: "auto",
    official: vRecord.official,
    probability: vRecord.score,
    source: "variant-confirmed",
  };
}


Fuzzy على canonicalList لاختيار أفضل مرشح:

let best = { score: 0, item: null };

for (const s of canonicalList) {
  const score = fuzzyMatchScore(nRaw, s.normalized);
  if (score > best.score) best = { score, item: s };
}

if (best.item && best.score >= 0.9) {
  return {
    status: "auto",
    official: best.item.canonical,
    probability: best.score,
    source: "canonical-fuzzy-auto",
  };
}

if (best.item && best.score >= 0.8) {
  return {
    status: "fuzzy",
    official: null,
    fuzzySuggestion: best.item.canonical,
    probability: best.score,
    source: "canonical-fuzzy-suggest",
  };
}


إن لم نجد شيء مقبول → manual:

return {
  status: "manual",
  official: null,
  probability: 0,
  source: "manual",
};

4. بناء محرك التعلّم (learningEngine.js)
4.1 بنية سجل variant
type VariantRecord = {
  official: string;
  occurrences: number;  // عدد مرات ظهور هذا raw لنفس official
  confirmed: boolean;   // true إذا نثق به
  manualCount: number;  // كم مرة اختاره المستخدم يدويًا
  autoCount: number;    // كم مرة طابقه النظام تلقائياً
  score: number;        // 0–1 درجة الثقة
  lastSeenAt: string | null;
};

4.2 تحميل القاموس المتعلم من storage

في المتصفح: localStorage.

أو على السيرفر: ملف JSON صغيرة.

export function loadSupplierVariants(storageKey, seededFromIndex = []) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      return JSON.parse(raw); // تأكد من ترقية البنية لو قديمة
    }
  } catch {}

  // لو ما فيه شيء (أول تشغيل) → بناه من suppliers_index.json
  const dict = {};
  for (const item of seededFromIndex) {
    const n = normalizeName(item.raw || item.alias || item.canonical);
    if (!n) continue;
    dict[n] = {
      official: item.canonical,
      occurrences: item.count || 1,
      confirmed: true, // نفترضها موثوقة كبذرة
      manualCount: 0,
      autoCount: 0,
      score: 0.95,
      lastSeenAt: null,
    };
  }
  return dict;
}

export function saveSupplierVariants(storageKey, dict) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(dict));
  } catch {}
}

4.3 حساب score
function computeVariantScore({ similarity, occurrences, manualCount, autoCount }) {
  const occBoost = 1 - Math.exp(-0.3 * occurrences); // منحنى أسي
  const manualBoost = manualCount > 0 ? 0.15 : 0;
  const autoBoost = Math.min(autoCount * 0.03, 0.15);

  let score = 0.6 * (similarity || 1) + 0.3 * occBoost + manualBoost + autoBoost;
  if (score > 1) score = 1;
  if (score < 0) score = 0;
  return Number(score.toFixed(3));
}

4.4 دالة learnSupplier (تُستدعى عند تأكيد المستخدم)
export function learnSupplier(rawName, official, variantsDict, storageKey, options = {}) {
  const n = normalizeName(rawName);
  if (!n || !official) return variantsDict;

  const existing = variantsDict[n] || {
    official,
    occurrences: 0,
    confirmed: false,
    manualCount: 0,
    autoCount: 0,
    score: 0,
    lastSeenAt: null,
  };

  const source = options.source || "manual"; // "manual" أو "auto"

  const occurrences = existing.occurrences + 1;
  const manualCount = existing.manualCount + (source === "manual" ? 1 : 0);
  const autoCount = existing.autoCount + (source === "auto" ? 1 : 0);

  const similarity =
    typeof options.similarityHint === "number"
      ? options.similarityHint
      : fuzzyMatchScore(n, normalizeName(official)); // عادة عالي جداً

  const score = computeVariantScore({ similarity, occurrences, manualCount, autoCount });

  const confirmed =
    existing.confirmed ||
    source === "manual" ||           // قرار اليدوي قوي
    score >= 0.92 ||                 // ثقة عالية
    occurrences >= 3;                // ظهور متكرر

  const updatedDict = {
    ...variantsDict,
    [n]: {
      official,
      occurrences,
      manualCount,
      autoCount,
      confirmed,
      score,
      lastSeenAt: new Date().toISOString(),
    },
  };

  saveSupplierVariants(storageKey, updatedDict);
  return updatedDict;
}

4.5 تغليف المحرك في كائن واحد (اختياري)
export function createSuppliersEngine({ storageKey, canonicalList, seededIndex }) {
  let variants = loadSupplierVariants(storageKey, seededIndex);

  return {
    resolve: (rawName) => resolveSupplier(rawName, canonicalList, variants),
    learn: (rawName, official, opts) => {
      variants = learnSupplier(rawName, official, variants, storageKey, opts);
      return variants;
    },
    getVariants: () => variants,
  };
}

5. كيف يدمج المبرمج هذا في الواجهة (باختصار)

(أنت قلت لا تركّز على App.jsx، لذا فقط أعطي صورة عامة)

عند تحميل الصفحة:

حمّل suppliers_canonical.json.

حمّل suppliers_index.json كبذرة للتعلم.

أنشئ suppliersEngine = createSuppliersEngine({...}).

عند تحليل ملف Excel:

لكل صف:

const result = suppliersEngine.resolve(row.supplierRaw);

خزّن:

supplierStatus = result.status

supplierOfficial = result.official || result.fuzzySuggestion

supplierProbability = result.probability

عند تأكيد المستخدم قراره في UI:

suppliersEngine.learn(rawValue, chosenOfficial, { source: "manual" });

عند إعادة فتح النظام:

loadSupplierVariants يعيد ما حُفظ في localStorage ويكمل التعلّم.

6. ملخص ما يجب على المبرمج فعله بالترتيب

يبني ملف suppliers_canonical.json من:

companies_cleaned.json + companies.json + suppliers_index.json.

ينشئ ملف normalization.js ويضع فيه normalizeName.

ينشئ ملف matching.js ويضع فيه:

fuzzyMatchScore

resolveSupplier

ينشئ ملف learningEngine.js ويضع فيه:

loadSupplierVariants

saveSupplierVariants

computeVariantScore

learnSupplier

createSuppliersEngine

يربطه بالواجهة:

كل اسم مورد خام → يمر عبر suppliersEngine.resolve.

قرارات المستخدم → suppliersEngine.learn.