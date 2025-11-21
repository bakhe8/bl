📄 Learning Engine Specification

(محرك تعلّم البنك/المورد بناءً على قرارات المستخدم فقط)

1. الهدف (Purpose)

محرك التعلّم مسؤول عن شيء واحد فقط:

تحويل القيم الخام للبنك والمورد (من Excel) إلى أسماء رسمية، باستخدام تعلّم سابق مبني بالكامل على قرارات المستخدم.

لا يوجد:

ذكاء اصطناعي

تخمين ذاتي

علاقات معقّدة

قواعد خفية

كل سطر في Excel يمر على منطق واضح يمكن شرحه للمستخدم.

2. نطاق العمل (Scope)

يشمل محرك التعلّم:

تنظيف القيم الخام (Normalization)

البحث في قاموس التعلم (Variants Dictionary)

محاولة تطابق مباشر Exact

محاولة تطابق قريب Fuzzy (اختياري + محافظ)

تحديد حالة السطر (Auto / Fuzzy / Manual)

تسجيل القرارات المعتمدة كمعلومات متعلَّمة جديدة (Learning)

ولا يشمل:

قراءة Excel (مسؤولية وحدة أخرى)

تنسيق المبالغ أو التواريخ

توليد الخطاب HTML

حفظ أو تحميل الملفات من القرص

3. أنواع البيانات الأساسية (Data Structures)
3.1 قاموس المتغيرات للموردين (Supplier Variants)

ملف JSON:

{
  "cure dev": "شركة كير للتطوير",
  "cure dev.": "شركة كير للتطوير",
  "cure development": "شركة كير للتطوير"
}


المفاتيح: النص الخام بعد التنظيف (normalized)

القيم: الاسم الرسمي بالعربية (official supplier name)

ملاحظة: نفس الفكرة للبنوك في ملف bank_variants.json.

3.2 قاموس الأسماء الرسمية (Official Dictionaries)

اختياري، يمكن أن يكون:

{
  "suppliers": [
    "شركة كير للتطوير",
    "شركة كير للتقنية",
    "شركة الهدى للتجارة"
  ],
  "banks": [
    "البنك العربي الوطني",
    "البنك الأهلي السعودي",
    "البنك السعودي الفرنسي"
  ]
}


يُستخدم:

لعرض قائمة الاختيارات في واجهة حلّ القرارات

للتحقق أن القيم الرسمية المستخدمة حقيقية وليست مدخلة بالخطأ

3.3 حالة السجل (Record Resolution Status)

لكل سجل Excel بعد المعالجة، نضيف حقول مثل:

{
  rowIndex: 5,
  bankRaw: "ANB",
  supplierRaw: "CURE DEV",
  // ...
  bankStatus: "auto" | "fuzzy" | "manual",
  supplierStatus: "auto" | "fuzzy" | "manual",
  bankOfficial: "البنك العربي الوطني" | null,
  supplierOfficial: "شركة كير للتطوير" | null,
  bankFuzzySuggestion: "…" | null,
  supplierFuzzySuggestion: "…" | null
}

4. التنظيف (Normalization Rules)
4.1 الهدف

إزالة الاختلافات الشكلية البسيطة، دون تغيير المعنى.

4.2 ما يُسمح به (مهم جدًا)

تحويل إلى lowercase (للقيم الإنجليزية)

إزالة الفراغات من البداية والنهاية (trim)

استبدال الفراغات المكررة بفراغ واحد

إزالة النقاط . فقط

إزالة الفراغات قبل/بعد بعض الرموز البسيطة

4.3 ما يُمنع تمامًا

إزالة كلمات مثل: bank, company, co, ltd عشوائيًا

إعادة ترتيب الكلمات

حذف أجزاء من الاسم

تخمين نص جديد

4.4 دالة مقترحة (JavaScript)
export function normalizeName(input) {
  if (!input) return "";

  return String(input)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")     // collapse multiple spaces
    .replace(/\./g, "");      // remove dots
}


هذه الدالة تُستخدم للبنك والمورد معاً.

5. منطق المطابقة (Matching Logic)
5.1 مراحل المطابقة

لكل قيمة خام (bankRaw أو supplierRaw):

Normalize → إنتاج normalized

Exact match في قاموس variants

عند الفشل: Fuzzy match (اختياري)

عند الفشل: تعاد كـ manual وتظهر في Panel حل القرارات

5.2 التطابق المباشر (Exact Match)
export function exactMatch(raw, variantsDict) {
  const n = normalizeName(raw);
  if (!n) return null;

  return variantsDict[n] || null;
}


إذا أعادت قيمة ليست null → الحالة auto.

5.3 التطابق القريب (Fuzzy Match) – اختياري ومحافظ
5.3.1 دالة تشابه بسيطة (String Similarity)

ليست أفضل خوارزمية في العالم، لكنها:

صغيرة

مفهومة

كافية لبياناتك (أسماء قصيرة)

function simpleSimilarity(a, b) {
  if (!a || !b) return 0;

  const s1 = normalizeName(a);
  const s2 = normalizeName(b);

  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1;

  let same = 0;
  for (let i = 0; i < Math.min(s1.length, s2.length); i++) {
    if (s1[i] === s2[i]) same++;
  }

  return same / maxLen;  // between 0 and 1
}

5.3.2 البحث عن أفضل مرشح
export function fuzzyMatch(raw, variantsDict, threshold = 0.9) {
  const keys = Object.keys(variantsDict);
  if (!keys.length) return null;

  let bestKey = null;
  let bestScore = 0;

  for (const key of keys) {
    const score = simpleSimilarity(raw, key);
    if (score > bestScore) {
      bestScore = score;
      bestKey = key;
    }
  }

  if (bestScore >= threshold) {
    return {
      key: bestKey,
      official: variantsDict[bestKey],
      score: bestScore
    };
  }

  return null;
}


العتبة threshold = 0.9 (90%) لتقليل الأخطاء.

6. واجهة الدالة الرئيسة لكل قيمة (Resolve Function)
6.1 حل مورد واحد
export function resolveSupplier(raw, variantsDict, options = {}) {
  const { enableFuzzy = true, fuzzyThreshold = 0.9 } = options;

  // حالة عدم وجود قيمة أساسًا
  if (!raw || !String(raw).trim()) {
    return {
      status: "manual",
      official: null,
      fuzzySuggestion: null
    };
  }

  // 1) Exact
  const exact = exactMatch(raw, variantsDict);
  if (exact) {
    return {
      status: "auto",
      official: exact,
      fuzzySuggestion: null
    };
  }

  // 2) Fuzzy
  if (enableFuzzy) {
    const fuzzy = fuzzyMatch(raw, variantsDict, fuzzyThreshold);
    if (fuzzy) {
      return {
        status: "fuzzy",
        official: fuzzy.official,
        fuzzySuggestion: fuzzy.official
      };
    }
  }

  // 3) Manual
  return {
    status: "manual",
    official: null,
    fuzzySuggestion: null
  };
}


نفس الفكرة للبنك resolveBank.

7. دمج محرك التعلّم مع السجلات (Records Pipeline)
7.1 نقطة الإدماج في خطوات النظام

التسلسل الصحيح بعد قراءة Excel:

قراءة السجلات من Excel → rawRecords

تنظيف وتحويل القيم إلى JSON بسيط

تمرير كل سجل إلى:

function enrichRecordWithLearning(record, supplierVariants, bankVariants) {
  const supplierResolution = resolveSupplier(record.supplierRaw, supplierVariants);
  const bankResolution     = resolveSupplier(record.bankRaw, bankVariants);

  return {
    ...record,
    supplierStatus:   supplierResolution.status,
    supplierOfficial: supplierResolution.official,
    supplierFuzzySuggestion: supplierResolution.fuzzySuggestion,

    bankStatus:   bankResolution.status,
    bankOfficial: bankResolution.official,
    bankFuzzySuggestion: bankResolution.fuzzySuggestion,

    needsDecision:
      supplierResolution.status !== "auto" ||
      bankResolution.status !== "auto"
  };
}


قائمة السجلات التي needsDecision = true تظهر في Panel “حل القرارات”.

بقية السجلات تدخل مباشرة في مرحلة تجهيز الخطابات.

8. منطق التعلّم نفسه (Learning Logic)
8.1 متى يعتبر النظام أن المستخدم “علّم” معلومة جديدة؟

فقط في الحالات التالية:

المستخدم اختار من القائمة الرسمية (bank/supplier)

أو اختار “إضافة مورد جديد” وأدخله بشكل صريح

أو وافق على ربط fuzzy suggestion بقيمة رسمية

8.2 ماذا يحدث عند التعلّم؟

نضيف سطرًا جديدًا إلى variantsDict:

function learnVariant(raw, official, variantsDict) {
  const n = normalizeName(raw);
  if (!n || !official) return variantsDict;

  // لا نعيد الكتابة إذا كان موجوداً بنفس القيمة
  if (variantsDict[n] && variantsDict[n] === official) return variantsDict;

  return {
    ...variantsDict,
    [n]: official
  };
}

8.3 قواعد أمان مهمة:

لا نسمح بالتعلم من قيمة تلقائية auto فقط ← يجب أن تكون مرتبطة بقرار المستخدم أو تأكيده.

لا نسمح بحفظ official لا يوجد في قائمة الأسماء الرسمية، إلا إذا أدخله المستخدم يدويًا وهو يعلم ما يفعل.

لا يوجد “Undo”، لكن يمكن تصحيح التعلم عبر:

تعديل القيمة في القاموس JSON

أو استيراد قاموس مصحح

9. التخزين (Persistence)
9.1 مكان التخزين

اختياران:

LocalStorage (محلي في المتصفح)

ملف JSON يتم تحميله/تصديره يدويًا

9.2 مثال LocalStorage
const SUPPLIER_VARIANTS_KEY = "bgl_supplier_variants";

export function loadSupplierVariants() {
  try {
    const raw = localStorage.getItem(SUPPLIER_VARIANTS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveSupplierVariants(dict) {
  localStorage.setItem(SUPPLIER_VARIANTS_KEY, JSON.stringify(dict));
}


نفس الشيء للبنوك.

10. ربط التعلّم بالواجهة (UI Integration)
10.1 عندما يختار المستخدم بنك/مورد من Panel “حل القرارات”

الإجراء يكون تقريبًا:

function onConfirmDecision(rowId, chosenBankOfficial, chosenSupplierOfficial) {
  // 1) تحديث السجل نفسه
  // 2) تعلّم البنك الجديد إن لزم
  // 3) تعلّم المورد الجديد إن لزم

  // مثال للمورد:
  const record = /* الحصول على السجل بالمعرف rowId */;
  supplierVariants = learnVariant(
    record.supplierRaw,
    chosenSupplierOfficial,
    supplierVariants
  );
  saveSupplierVariants(supplierVariants);

  // تحديث حالة السجل في state: supplierStatus = "auto"
}

10.2 تأثير ذلك على المستقبل

في المرة القادمة:

نفس القيمة الخام لن تظهر في حل القرارات

سيعتبرها النظام “مفهومة ومعلّمة سابقًا”

11. سيناريوهات خاصة (Edge Cases)
11.1 القيمة الخام فارغة
if (!raw || !String(raw).trim()) {
  return { status: "manual", official: null, fuzzySuggestion: null };
}

11.2 القاموس كبير جدًا

عمومًا عدد الموردين لن يتجاوز 1000، وهو عدد صغير جدًا

لا حاجة لتقنيات أداء خاصة في هذه المرحلة

يمكن تنظيف القاموس يدويًا عند الحاجة

11.3 ملفات Excel مشوّهة (؟؟؟ – Encoding)

إذا كانت القيم تحتوي ؟؟؟:

ينبغي أن يتم رفض الملف في وحدة استيراد Excel قبل الوصول لمحرك التعلّم

Learning Engine يفترض أن النصوص صالحة للقراءة

12. الخلاصة للمبرمج

محرك التعلّم عبارة عن دوال JS صغيرة + ملف JSON

لا خوارزميات ثقيلة ولا AI ولا تعقيد

كل ما يفعله:

تنظيف الاسم

محاولة إيجاد قيمة رسمية في قاموس variants

إرجاع حالة (auto / fuzzy / manual)

تسجيل التعلم عند تأكيد المستخدم

التكامل يتم بين وحدة Excel Parser وواجهة حل القرارات ومرحلة إعداد الخطاب.