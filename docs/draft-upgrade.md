دليل تطوير نظام التعلّم (Learning Engine Upgrade Guide)
________________________________________
1) الوضع الحالي للنظام (Current State)
يحتوي النظام الحالي على آلية أساسية للتعلّم، مبنية على الملفات التالية:
•	learning.js
•	matching.js
•	normalization.js
•	decisionUtils.js
1.1 آلية التعلم الحالية
1.	يقوم النظام بتطبيع الاسم الخام للمورد.
2.	يبحث عنه في قاموس التعلم (variantsDict).
3.	إن لم يجده، يقوم بإنشاء سجل جديد.
4.	يزيد عدّاد مرات الظهور.
5.	يصبح الاسم "مؤكّدًا" بعد 3 مرات فقط.
6.	يتم حفظ التغير فورًا في LocalStorage.
1.2 مشاكل النظام الحالي
🔴 مشاكل في الأمان الدلالي للتعلم
•	المستخدم قد يربط اسمًا خاطئًا باسم رسمي.
•	بعد 3 مرات فقط يصبح الربط مؤكدًا ودائمًا.
•	لا يوجد زر تراجع (Undo).
•	لا يوجد حماية من الأسماء العشوائية.
🔴 مشاكل في الدقّة اللغوية
•	التطبيع ممتاز للعربية ولكنه ضعيف للإنجليزية.
•	المقارنة تعتمد على similarity حرفية فقط.
•	لا توجد مقارنة على مستوى الكلمات.
🔴 مشاكل في التحكم
•	النظام يتعلم مباشرة بدون مراجعة.
•	لا يوجد Layer للفصل بين:
o	التعلم المؤقت
o	التعلم المؤكد
o	التعلم النهائي
🔴 مشاكل في الانتشار (Propagation)
•	القرارات تنتشر بناءً على التشابه الخام فقط.
•	لا تستخدم aliases المتعلمة بشكل ذكي.
________________________________________
2) الحلول المقترحة (Proposed Enhancements)
هذه الحزمة من التحسينات تحول النظام من Learner بسيط إلى Learning Engine قوي وآمن.
2.1 تحسين التطابق اللغوي
•	استخدام مقارنة مبنية على الكلمات وليس الحروف فقط.
•	وزن للكلمات المهمة.
•	سيناريوهات للغات (عربي > إنجليزي > مختلط).
•	منع تعلم الأسماء ذات الجودة اللغوية الضعيفة.
2.2 تأكيد تدريجي
إضافة مستويات:
1.	Tentative (مؤقت) — ظهور 1
2.	Semi-confirmed (شبه مؤكد) — ظهور 2
3.	Confirmed (مؤكد) — ظهور 3
4.	Permanent (نهائي) — ظهور 4 أو بعد موافقة المستخدم
2.3 منع التعلم الخاطئ
•	فحص التعارض بين aliases.
•	منع التعلم عند الاشتباه بأن الاسم "Random".
•	تحذير المستخدم إذا similarity ضعيف جدًا.
2.4 إضافة نظام نقاط (Confidence Score)
كل alias يحصل على:
confidence = (similarityFactor + occurrenceFactor + languageFactor)
2.5 إضافة طبقة Pending للتراجع
بدل الحفظ المباشر في LocalStorage:
•	pendingVariants (قائمة انتظار)
•	confirmedVariants (المؤكدة)
•	زر "حفظ القاموس"
•	زر "تراجع"
2.6 تحسين انتشار القرارات
•	نشر القرار بين السجلات بناءً على aliases المتعلمة.
•	نشر القرار على مستوى الملف فقط.
________________________________________
3) المنطق الداخلي للتحسينات (Logic Behind Enhancements)
3.1 منطق التأكيد التدريجي
الهدف حماية النظام من التعلم الخاطئ.
بدلًا من:
if occurrences >= 3 → confirmed
نستخدم:
if occurrences == 1 → tentative
if occurrences == 2 → semi-confirmed
if occurrences == 3 → confirmed
if occurrences >= 4 → permanent
3.2 منطق تحليل اللغة
قبل التعلم:
•	إذا الاسم إنجليزي فقط: weight منخفض
•	إذا الاسم عربي فقط: weight عالي
•	إذا مختلط: يعتبر اسمًا غير موثوق
3.3 منطق الكلمات
تجزئة الاسم إلى كلمات:
"شركة كير للتطوير" → [شركة, كير, للتطوير]
"كير تطوي" → [كير, تطوي]
حساب التشابه:
wordMatchScore = (عدد الكلمات المشتركة × وزن) / (إجمالي الكلمات)
3.4 منطق منع التعلم الخاطئ
إذا raw يحتوي:
•	رموز كثيرة
•	أرقام فقط
•	نص عشوائي (entropy عالي)
→ يتم رفض التعلم تلقائيًا.
3.5 منطق إدارة التعارض
إذا alias جديد يتعارض مع alias سابق:
•	يتم منع التعلم.
•	يظهر تنبيه للمستخدم:
"لا يمكن ربط هذا الاسم لأنه مرتبط سابقًا بجهة أخرى".
________________________________________
4) عمليات التنفيذ والترقية (Upgrade Execution Plan)
4.1 خطوة 1 — تحديث normalization
•	إضافة تحليل اللغة.
•	إضافة اختبار randomness.
•	بناء tokenizer للكلمات.
4.2 خطوة 2 — تحديث matching
•	بناء similarity جديد يعتمد على الكلمات.
•	إضافة layer لحساب confidence.
4.3 خطوة 3 — تحديث learning.js
إضافة الحقول:
occurrences
confidence
status: tentative / semi / confirmed / permanent
lastSeen
languageType
4.4 خطوة 4 — إضافة pending layer
الهيكل الجديد:
variants = {
  confirmed: {...},
  pending: {...}
}
4.5 خطوة 5 — تعديل decisionUtils
•	نشر القرار باستخدام aliases الجديدة.
•	عدم السماح بانتشار خاطئ.
4.6 خطوة 6 — تعديل Panels
•	إضافة مؤشر الثقة.
•	إضافة شارة status.
•	إضافة خيار إلغاء تعلم alias.
4.7 خطوة 7 — تحديث ملف التصدير والاستيراد
•	دعم مستويين: pending + confirmed.
________________________________________
5) الخوارزمية الجديدة (New Learning Algorithm)
5.1 الخطوة 1 — Normalize
normalized = normalize(raw)
languageType = detectLanguage(normalized)
5.2 الخطوة 2 — Word Tokenizing
rawWords = tokenize(normalized)
officialWords = tokenize(official)
5.3 الخطوة 3 — Calculate Similarity
similarity = computeWordSimilarity(rawWords, officialWords)
5.4 الخطوة 4 — Compute Confidence
confidence = similarity * 0.6 + occurrences * 0.3 + languageWeight * 0.1
5.5 الخطوة 5 — Validate Safety
if isRandom(raw) → reject
if conflictExists(raw, official) → reject
5.6 الخطوة 6 — Update Occurrence
occurrences++
status = determineStatus(occurrences)
5.7 الخطوة 7 — Store in pending
pending[normalized] = {
  official,
  occurrences,
  status,
  confidence,
  lastSeen: now
}
________________________________________
6) إضافات أخرى مقترحة (Optional Enhancements)
• إضافة شاشة إدارة القواميس
•	قائمة aliases
•	حالة كل alias
•	زر حذف
•	زر ترقية alias إلى permanent
• إضافة شريط ثقة في Panels
مثال:
Confidence: 82%
Status: Semi-confirmed
• إضافة سجل تعلم (Learning Log)
•	كل عملية تعلم يتم تسجيلها.
•	يمكن للمسؤول مراجعتها.
• دعم الذكاء الاصطناعي
تحسين matching باستخدام نموذج AI بسيط.
________________________________________
7) الخلاصة
المستند يعطي:
•	الوضع الحالي
•	المشاكل
•	الحلول المقترحة
•	المنطق الخلفي
•	خطة التنفيذ
•	الخوارزمية الجديدة
•	إضافات اختيارية
وهذا يجعل النظام قابلًا للترقية بشكل احترافي وبدون كسر أي جزء من البرنامج.


✅ كيف تعمل آلية التعلّم فعليًا داخل البرنامج؟ (شرح حقيقي مبني على الكود)
1) البداية: تحميل القواميس (Load)
يتم تحميل الـ variants من LocalStorage عند تشغيل التطبيق عبر:
loadVariants(key, defaultRecords, officialLookup)
وهو موثّق في:
•	learning.js —
وظيفته:
•	إذا وجد نسخة محفوظة سابقًا → يعيدها
•	إذا لم يجد → يبني القاموس من JSON الأصلي variants_suppliers.json
النتيجة:
يتم تحميل قاموس الموردين فقط (البنوك لا يتم تعلّمها).
________________________________________
2) عند محاولة مطابقة اسم مورد جديد (matching)
الدالة المستخدمة داخل App.jsx:
resolveSupplierValue(...)
وهي تأتي من:
•	matching.js —
هذه الدالة تعمل بالترتيب التالي:
الخطوة A — Exact Match
إذا الاسم من الملف موجود رسميًا → auto.
الخطوة B — Lookup في القاموس المتعلم variantsDict
const variantRaw = variantsDict[normalizedRaw];
•	إذا موجود → auto مباشرة
•	حتى لو لم يصل occurrences = 3
هذا واضح من السطر —
الخطوة C — Fuzzy Matching
إذا الاسم ليس رسميًا ولا في الـ variants
يبدأ النظام يحاول fuzzy matching (تشابه بسيط جدًا).
نتيجة:
•	إذا score ≥ fuzzyAuto → auto
•	إذا fuzzySuggest → يقترح (fuzzy) ولا يقرر
________________________________________
3) عند قيام المستخدم باختيار المورد والبنك (Decision Save)
الحدث الرئيسي في App.jsx:
•	handleDecisionSave —
يتم استدعاء:
setSupplierVariants((dict) =>
  learnVariant(selectedRecord.supplierRaw, supplierOfficial, dict, SUPPLIER_VARIANTS_KEY)
);
وهي نقطة التعلّم الأساسية.
________________________________________
🎓 كيف يتم التعلّم فعليًا في learnVariant؟
الكود من learning.js —
🔧 الخطوات:
1.	Normalize
const n = normalizeName(raw);
2.	جلب القيد الموجود إن وجد
const existingRaw = variantsDict[n];
3.	تجميع occurrences
const occurrences = existing ? (existing.occurrences || 1) + 1 : 1;
4.	وضع confirmed عندما يصل التكرار ≥ 3
confirmed: existing ? existing.confirmed || occurrences >= 3 : occurrences >= 3
5.	تحديث LocalStorage
localStorage.setItem(key, JSON.stringify(updated));
________________________________________
📌 الاستنتاج: كيف يتعلم النظام فعليًا؟
1.	كل مرة المستخدم يأخذ قرار يدوي → يتم تسجيل الاسم الخام normalized + الاسم الرسمي.
2.	كل تكرار يزيد occurrences.
3.	عند 3 مرات → يتحول القيد إلى confirmed.
4.	بعد ذلك أي ظهور جديد لنفس الاسم الخام يصبح auto matching.
________________________________________
❌ مشاكل التعلّم الحالية (مبنية على الكود وليس كلام إنشائي)
1) مشكلة: التعلم يعتمد على التطبيع البسيط فقط
التطبيع في normalizeName() غير مذكور هنا، لكن من التجربة:
•	لا يتعامل مع تنوّع كبير في الأسماء
•	لا يفصل الكلمات المركبة
•	لا يتعامل مع أخطاء الكتابة
النتيجة:
البرنامج قد يفشل في التعلّم إذا تغيّر الاسم قليلًا جدًا.
________________________________________
2) مشكلة: الـ similarity المستخدم بدائي جدًا
الكود من matching.js:
for (let i = 0; i < Math.min(s1.length, s2.length); i++) {
  if (s1[i] === s2[i]) same++;
}
return same / maxLen;
—
هذا أسوأ نوع من الـ similarity لأن:
•	يقارن الأحرف في نفس المواقع فقط
•	لا يفهم التبديل أو الحذف أو الإضافة
•	لا يشبه Levenshtein أو Jaro-Winkler
النتيجة:
المطابقة الضبابية ضعيفة وغير دقيقة — خصوصًا لأسماء عربية/إنجليزية.
________________________________________
3) مشكلة: تعلّم البنك غير موجود
المطابقة للبنوك تعتمد فقط على القاموس الرسمي:
—
لا يوجد أي تعلم للبنوك.
النتيجة:
إذا كان اسم البنك في الإكسل مكتوب بطريقة مختلفة، البرنامج لن يتعلمه.
________________________________________
4) مشكلة: confirmed = occurrences ≥ 3 ثابت وغير ذكي
قد يكون المورد غير مهم، وبمجرد تكرار 3 مرات يصبح دائمًا auto.
لا يوجد:
•	وزن للتاريخ
•	وزن لمصدر الملف
•	مراجعة بشرية
•	تراجع (undo)
________________________________________
5) مشكلة: localStorage فقط → سيفرغ عند Clear Cache
ليس هناك:
•	تخزين على ملف خارجي
•	نسخة احتياطية
•	sync مع ملفات JSON الرسمية
________________________________________
💡 سأقوم بحلّ كل مشكلة بنفس الترتيب الذي ذكرتها لك، ومع كل حل أضع:
1.	المنطق الجديد (Logic)
2.	الكود المقترح (Actual Implementation)
3.	كيف يندمج مع الكود الحالي
4.	ماذا يحلّ من مشكلة
لنبدأ…
________________________________________
✅ 1) ضعف الـ similarity البدائي → حل شامل بمحرك Fuzzy قوي
🔥 المشكلة (من matching.js)
المقارنة الحالية حرفية جدًا:
for (let i = 0; i < Math.min(s1.length, s2.length); i++) {
  if (s1[i] === s2[i]) same++;
}
return same / maxLen;
❌ هذا يمنع التطابق بين:
•	“مصرف الراجحي”
•	“الراجحي”
•	“rajhi bank”
•	“alrajhi”
________________________________________
✅ الحل: استبدال التشابه بسيستم كلمات + خوارزمية Jaro-Winkler
1) منطق التطابق الجديد
•	نطبع الاسم
•	نقسمه إلى كلمات
•	نعمل مقارنة كلمات (Word Intersection)
•	نضيف عليها Jaro-Winkler
•	ندمجها في Score واحد
2) الكود المقترح
import { jaroWinkler } from "talisman/metrics/distance/jaro-winkler";

export function smartSimilarity(a, b) {
  if (!a || !b) return 0;

  const s1 = normalizeName(a);
  const s2 = normalizeName(b);

  const words1 = new Set(s1.split(" "));
  const words2 = new Set(s2.split(" "));

  let commonWords = 0;
  for (const w of words1) {
    if (words2.has(w)) commonWords++;
  }

  const wordScore = commonWords / Math.max(words1.size, words2.size);
  const jwScore = jaroWinkler(s1, s2);

  // Weighted combination
  return (wordScore * 0.6) + (jwScore * 0.4);
}
3) الدمج في المشروع
استبدل simpleSimilarity في:
•	matching.js
•	أو utils.js
4) ما الذي يحلّه؟
•	يتعرف على الاختصارات
•	يتعرف على الترتيب المختلف للكلمات
•	يتعرف على الإنجليزية والعربية
•	يقلل الأخطاء بشكل كبير
________________________________________
✅ 2) confirmed بعد 3 مرات فقط → بدون منطق ذكي
🔥 المشكلة
الكود الحالي يجعل أي اسم يظهر 3 مرات يصبح “مؤكد”.
________________________________________
✅ الحل: تأكيد تدريجي بـ 4 مستويات
1) المنطق
occurrences == 1 → tentative
occurrences == 2 → semi-confirmed
occurrences == 3 → confirmed
occurrences >= 4 → permanent
2) الكود المقترح (learning.js)
function statusFromOccurrences(o) {
  if (o === 1) return "tentative";
  if (o === 2) return "semi";
  if (o === 3) return "confirmed";
  return "permanent";
}

export function learnVariant(raw, official, dict, key) {
  const n = normalizeName(raw);
  const existing = dict[n];

  const o = existing ? existing.occurrences + 1 : 1;

  const updated = {
    official,
    occurrences: o,
    status: statusFromOccurrences(o),
    lastSeen: Date.now()
  };

  dict[n] = updated;

  localStorage.setItem(key, JSON.stringify(dict));
  return dict;
}
3) ما الذي يحلّه؟
•	يمنع التعلّم السريع الخاطئ
•	يعطي مراحل واضحة لتطور الاسم
•	يتيح لك رؤية تقدم التعلم داخل Panels
________________________________________
✅ 3) لا يوجد فحص لغوي ولا كشف عشوائية
🔥 المشكلة
النظام يتعلم أسماء مثل:
•	“xxxx”
•	“1234”
•	“—-”
________________________________________
✅ الحل: فحص randomness قبل التعلم
1) منطق الكشف
•	إذا أكثر من 40% من الأحرف ليست عربية ولا إنجليزية: random
•	إذا الاسم قصير جدًا < 3 أحرف: random
•	إذا يحتوي 60% رموز: random
2) الكود
function isRandomName(s) {
  const norm = s.replace(/\s+/g, "");

  if (norm.length < 3) return true;

  const letters = norm.match(/[a-zA-Z\u0600-\u06FF]/g) || [];
  const symbols = norm.length - letters.length;

  return (symbols / norm.length) > 0.4;
}
ثم داخل learnVariant:
if (isRandomName(raw)) return dict; // لا نتعلم garbage
3) ما الذي يحلّه؟
•	يمنع إدخال أخطاء بشرية إلى التعلم
•	يحافظ على جودة النظام
•	يمنع فساد القاموس
________________________________________
✅ 4) لا يوجد “Undo” → كل شيء يُخزن فوريًا
🔥 المشكلة:
أي قرار يتم تخزينه فورًا في LocalStorage
ولا يوجد رجوع.
________________________________________
✅ الحل: إضافة طبقة PENDING قبل التخزين
1) المنطق
بدل التخزين المباشر:
dict.pending[n] = updated
وعند الضغط على “حفظ”:
dict.confirmed = { ...dict.confirmed, ...dict.pending }
dict.pending = {}
2) الكود المقترح
export function learnVariant(raw, official, dict) {
  const n = normalizeName(raw);

  const existing = dict.pending[n] || dict.confirmed[n];
  const o = existing ? existing.occurrences + 1 : 1;

  dict.pending[n] = {
    official,
    occurrences: o,
    status: statusFromOccurrences(o),
    lastSeen: Date.now()
  };

  return dict;
}

export function commitVariants(dict, key) {
  dict.confirmed = { ...dict.confirmed, ...dict.pending };
  dict.pending = {};
  localStorage.setItem(key, JSON.stringify(dict.confirmed));
}
3) ما الذي يحلّه؟
•	تراجع كامل
•	منع الحفظ التلقائي الخاطئ
•	السماح بالمراجعة قبل التخزين
________________________________________
✅ 5) انتشار المفاهيم (Propagation) بدائي
🔥 المشكلة:
الانتشار يعتمد فقط على raw string.
________________________________________
✅ الحل: الانتشار عبر alias + similarity
1) المنطق
إذا تعلم النظام أن:
"cure dev" → "شركة كير"
ثم ظهر “كير ديف” في نفس الملف…
يجب أن ينتشر القرار.
2) الكود
function propagateAlias(records, raw, official, dict) {
  const normalized = normalizeName(raw);

  for (const r of records) {
    const cand = normalizeName(r.supplierRaw);
    const sim = smartSimilarity(cand, normalized);

    if (sim > 0.85) {
      r.supplierOfficial = official;
      r.supplierStatus = "auto";
    }
  }
}
3) ما الذي يحلّه؟
•	انتشار أذكى
•	معالجة الحالات القريبة
•	توفير وقت للمستخدم
________________________________________


التالي هو ثلاث ملفات معدله للاقتراح يستفيد منها المبرمج :


1️⃣ ملف normalization.js (تقوية normalizeName)
// logic/normalization.js

const AR_DIACRITICS =
  /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const AR_TATWEEL = /\u0640/g; // ـ
const AR_DIGITS = /[\u0660-\u0669]/g;

// توحيد أشكال الحروف العربية (همزات، تاء مربوطة، ى ...)
const normalizeArabicShapes = (text) =>
  text
    .replace(/[\u0622\u0623\u0625\u0671]/g, "ا") // آ/أ/إ/ٱ → ا
    .replace(/\u0629/g, "ه") // ة → ه
    .replace(/\u0649/g, "ي") // ى → ي
    .replace(/\u0626/g, "ي") // ئ → ي
    .replace(/\u0624/g, "و"); // ؤ → و

// تحويل الأرقام العربية الهندية إلى أرقام إنجليزية
const normalizeArabicDigits = (text) =>
  text.replace(AR_DIGITS, (d) =>
    String(d.charCodeAt(0) - 0x0660)
  );

/**
 * normalizeName
 * - تنظيف الإسم للأغراض الداخلية (تطابق/تعلم)
 * - تحافظ على سلوكك القديم، وتضيف:
 *   - توحيد Unicode (NFKC)
 *   - إزالة التطويل
 *   - تحويل الأرقام العربية الهندية
 */
export const normalizeName = (input) => {
  if (input === null || input === undefined) return "";
  let s = String(input).trim();

  // توحيد شكل النص في Unicode قدر الإمكان
  try {
    s = s.normalize("NFKC");
  } catch {
    // بعض المتصفحات القديمة قد لا تدعم normalize – نتجاهل بهدوء
  }

  s = normalizeArabicShapes(s);
  s = s.replace(AR_DIACRITICS, "");
  s = s.replace(AR_TATWEEL, ""); // إزالة التطويل
  s = normalizeArabicDigits(s);

  // نقاط، فواصل، إلخ → مسافة
  s = s.replace(/[\.،,:;\/\\\-–—]+/g, " ");

  s = s.toLowerCase();
  s = s.replace(/\s+/g, " ");
  return s.trim();
};

// لا تغييرات كبيرة هنا – مفيد للمفاتيح العامة
export const normalizeKey = (key) =>
  String(key || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/gi, " ")
    .replace(/\s+/g, " ");

/**
 * formatDateValue
 * كما هي تقريبًا عندك – لم ألمسها إلا للتعليق فقط
 */
export const formatDateValue = (value) => {
  if (value === null || value === undefined || value === "") return "";
  const num = Number(value);
  let dateObj = null;

  // Excel serial number
  if (!Number.isNaN(num) && num > 59) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    dateObj = new Date(excelEpoch.getTime() + num * 86400 * 1000);
  } else {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      dateObj = parsed;
    }
  }

  if (!dateObj) return String(value);

  try {
    return (
      new Intl.DateTimeFormat("ar-SA", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(dateObj) + "م"
    );
  } catch {
    return dateObj.toISOString().split("T")[0];
  }
};
✅ هذه النسخة ما زالت ترجع نفس الناتج لاختبارك:
" الأَهْلي البنك " → "الاهلي البنك"
لكنها تتعامل بشكل أفضل مع:
•	الأرقام العربية الهندية
•	التطويل
•	علامات الترقيم
________________________________________
2️⃣ ملف matching.js – Fuzzy Matching + تعلم للبنوك
هنا نضيف:
•	خوارزمية Jaro-Winkler حقيقية
•	استخدام الـ fuzzy للـ suppliers و banks
•	دعم variantsDict للبنوك بنفس طريقة الموردين
•	إرجاع probability (درجة الثقة) مع النتيجة
// logic/matching.js
import { normalizeName } from "./normalization";

/**
 * Jaro distance
 */
const jaroDistance = (s1Raw, s2Raw) => {
  const s1 = s1Raw || "";
  const s2 = s2Raw || "";
  if (s1 === s2) return 1;
  const len1 = s1.length;
  const len2 = s2.length;
  if (!len1 || !len2) return 0;

  const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1;
  const s1Matches = new Array(len1).fill(false);
  const s2Matches = new Array(len2).fill(false);

  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, len2);

    for (let j = start; j < end; j++) {
      if (s2Matches[j]) continue;
      if (s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (!matches) return 0;

  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  transpositions /= 2;
  return (
    (matches / len1 + matches / len2 + (matches - transpositions) / matches) /
    3
  );
};

/**
 * Jaro-Winkler
 */
const jaroWinkler = (aRaw, bRaw, p = 0.1, maxPrefix = 4) => {
  const a = aRaw || "";
  const b = bRaw || "";
  if (!a.length || !b.length) return 0;
  const j = jaroDistance(a, b);
  let prefix = 0;
  const max = Math.min(maxPrefix, a.length, b.length);
  for (let i = 0; i < max && a[i] === b[i]; i++) {
    prefix++;
  }
  return j + prefix * p * (1 - j);
};

// استخدام normalized strings
const fuzzySimilarity = (normalizedA, normalizedB) =>
  jaroWinkler(normalizedA, normalizedB);

/**
 * توحيد شكل سجل الـ variant لو كان String أو Object قديم
 */
const asVariantRecord = (rawVariant) => {
  if (!rawVariant) return null;
  if (typeof rawVariant === "string") {
    return {
      official: rawVariant,
      occurrences: 1,
      confirmed: false,
      manualCount: 0,
      autoCount: 0,
      score: 0,
    };
  }
  return {
    official: rawVariant.official,
    occurrences: rawVariant.occurrences || 1,
    confirmed: Boolean(rawVariant.confirmed),
    manualCount: rawVariant.manualCount || 0,
    autoCount: rawVariant.autoCount || 0,
    score:
      typeof rawVariant.score === "number" ? rawVariant.score : 0,
  };
};

/**
 * 🔹 resolveBank – الآن يدعم:
 * - variantsDict (تعلم البنوك)
 * - Fuzzy قوي (Jaro-Winkler)
 * - probability
 */
export const resolveBank = (
  raw,
  officialBanks,
  variantsDict = {},
  fuzzyConfigOrThreshold = 0.9
) => {
  if (!raw || !String(raw).trim()) {
    return { status: "manual", official: null, fuzzySuggestion: null };
  }

  const normalizedRaw = normalizeName(raw);

  const config =
    typeof fuzzyConfigOrThreshold === "number"
      ? {
          fuzzyAuto: fuzzyConfigOrThreshold,
          fuzzySuggest: Math.min(fuzzyConfigOrThreshold, 0.85),
        }
      : {
          fuzzyAuto: fuzzyConfigOrThreshold.fuzzyAuto ?? 0.9,
          fuzzySuggest: fuzzyConfigOrThreshold.fuzzySuggest ?? 0.85,
        };

  // 1) learnt variants (من قرارات المستخدم السابقة)
  const variantRec = asVariantRecord(variantsDict[normalizedRaw]);
  if (variantRec) {
    const prob = variantRec.score || 0.95; // تخمين عالي للبيانات القديمة
    if (variantRec.confirmed || prob >= 0.9) {
      return {
        status: "auto",
        official: variantRec.official,
        fuzzySuggestion: null,
        probability: prob,
        source: "variant",
      };
    }
    if (prob >= 0.6) {
      return {
        status: "fuzzy",
        official: null,
        fuzzySuggestion: variantRec.official,
        probability: prob,
        source: "variant",
      };
    }
  }

  // 2) تجهيز البنوك الرسمية + الاختصارات
  const normalizedOfficial = officialBanks.map((b) => ({
    name: b.official,
    normalized: normalizeName(b.official),
    aliases: (b.short || []).map((a) => normalizeName(a)),
  }));

  // 3) تطابق رسمي مباشر
  const exactOfficial = normalizedOfficial.find(
    (b) => b.normalized === normalizedRaw
  );
  if (exactOfficial) {
    return {
      status: "auto",
      official: exactOfficial.name,
      fuzzySuggestion: null,
      probability: 1,
      source: "official-exact",
    };
  }

  // 4) تطابق alias مباشر
  const aliasHit = normalizedOfficial.find((b) =>
    b.aliases.includes(normalizedRaw)
  );
  if (aliasHit) {
    return {
      status: "auto",
      official: aliasHit.name,
      fuzzySuggestion: null,
      probability: 0.98,
      source: "alias-exact",
    };
  }

  // 5) Fuzzy بمقياس Jaro-Winkler
  let best = { score: 0, name: null };
  for (const b of normalizedOfficial) {
    const score = fuzzySimilarity(normalizedRaw, b.normalized);
    if (score > best.score) best = { score, name: b.name };
  }

  if (best.name && best.score >= config.fuzzyAuto) {
    return {
      status: "auto",
      official: best.name,
      fuzzySuggestion: best.name,
      probability: best.score,
      source: "official-fuzzy-auto",
    };
  }
  if (best.name && best.score >= config.fuzzySuggest) {
    return {
      status: "fuzzy",
      official: null,
      fuzzySuggestion: best.name,
      probability: best.score,
      source: "official-fuzzy-suggest",
    };
  }

  return { status: "manual", official: null, fuzzySuggestion: null };
};

/**
 * 🔹 resolveSupplierValue – يستخدم نفس مبدأ البنوك + variantsDict
 */
export const resolveSupplierValue = (
  raw,
  variantsDict,
  officialList = [],
  { fuzzyAuto = 0.9, fuzzySuggest = 0.8 } = {}
) => {
  if (!raw || !String(raw).trim()) {
    return { status: "manual", official: null, fuzzySuggestion: null };
  }

  const normalizedRaw = normalizeName(raw);
  const normalizedOfficialMap = new Map(
    officialList.map((o) => [normalizeName(o), o])
  );

  // 1) تطابق رسمي مباشر
  if (normalizedOfficialMap.has(normalizedRaw)) {
    return {
      status: "auto",
      official: normalizedOfficialMap.get(normalizedRaw),
      fuzzySuggestion: null,
      probability: 1,
      source: "official-exact",
    };
  }

  // 2) learnt variants
  const variantRec = asVariantRecord(variantsDict[normalizedRaw]);
  if (variantRec) {
    const prob = variantRec.score || 0.95;
    if (variantRec.confirmed || prob >= 0.9) {
      return {
        status: "auto",
        official: variantRec.official,
        fuzzySuggestion: null,
        probability: prob,
        source: "variant",
      };
    }
    if (prob >= 0.6) {
      return {
        status: "fuzzy",
        official: null,
        fuzzySuggestion: variantRec.official,
        probability: prob,
        source: "variant",
      };
    }
  }

  // 3) Fuzzy مع القائمة الرسمية
  let best = { score: 0, official: null };
  for (const [norm, official] of normalizedOfficialMap.entries()) {
    const score = fuzzySimilarity(normalizedRaw, norm);
    if (score > best.score) best = { score, official };
  }

  if (best.official && best.score >= fuzzyAuto) {
    return {
      status: "auto",
      official: best.official,
      fuzzySuggestion: best.official,
      probability: best.score,
      source: "official-fuzzy-auto",
    };
  }
  if (best.official && best.score >= fuzzySuggest) {
    return {
      status: "fuzzy",
      official: null,
      fuzzySuggestion: best.official,
      probability: best.score,
      source: "official-fuzzy-suggest",
    };
  }

  return { status: "manual", official: null, fuzzySuggestion: null };
};

// لو حبيت تستعمله مباشرة في أي مكان آخر
export const fuzzyMatchScore = (a, b) =>
  fuzzySimilarity(normalizeName(a), normalizeName(b));
✅ بهذا الشكل:
•	البنوك صار لها تعلم حقيقي عبر bankVariants (نفس مسار الموردين).
•	كل نتيجة فيها probability تقدر تستخدمها في UI لاحقًا (ألوان / شريط ثقة إلخ).
________________________________________
3️⃣ ملف learning.js – learnVariant + نظام احتمالي + learningEngine
هنا سنفعل التالي:
•	learnVariant:
o	يحسب similarity بين raw و official
o	يحسب score احتمالي اعتمادًا على:
	عدد التكرارات occurrences
	عدد القرارات اليدوية manualCount
	(مستقبلاً) عدد القرارات الآلية autoCount
o	يقرر confirmed بناءً على score وليس فقط >= 3 مرات
•	نضيف:
o	computeVariantScore
o	createLearningEngine كواجهة موحدة للبنوك والموردين
// logic/learning.js
import { normalizeName } from "./normalization";
import { fuzzyMatchScore } from "./matching";

/**
 * بناء قاموس من بذرة records (مثل variants_suppliers.json)
 */
export const buildVariantDict = (records = [], officialLookup = {}) => {
  const dict = {};
  for (const r of records) {
    const official = r.official || officialLookup[r.officialId];
    if (!official) continue;
    const normalizedRaw = normalizeName(r.raw || r.clean);
    if (!normalizedRaw) continue;
    dict[normalizedRaw] = {
      official,
      occurrences: r.occurrences || 1,
      confirmed: Boolean(r.confirmed),
      manualCount: r.manualCount || (r.confirmed ? 1 : 0),
      autoCount: r.autoCount || 0,
      score: r.score || 0.9, // بذرة عالية نسبياً
      lastSeenAt: r.lastSeenAt || null,
    };
  }
  return dict;
};

/**
 * ترقية القاموس القديم إلى الشكل الجديد
 */
const upgradeVariantDict = (dict = {}) => {
  const out = {};
  for (const [k, v] of Object.entries(dict)) {
    if (typeof v === "string") {
      out[k] = {
        official: v,
        occurrences: 1,
        confirmed: false,
        manualCount: 0,
        autoCount: 0,
        score: 0,
        lastSeenAt: null,
      };
    } else {
      out[k] = {
        official: v.official,
        occurrences: v.occurrences || 1,
        confirmed: Boolean(v.confirmed),
        manualCount: v.manualCount || 0,
        autoCount: v.autoCount || 0,
        score:
          typeof v.score === "number"
            ? v.score
            : v.confirmed
            ? 0.95
            : 0,
        lastSeenAt: v.lastSeenAt || null,
      };
    }
  }
  return out;
};

export const loadVariants = (key, defaultRecords = [], officialLookup = {}) => {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      return upgradeVariantDict(parsed);
    }
    return buildVariantDict(defaultRecords, officialLookup);
  } catch {
    return buildVariantDict(defaultRecords, officialLookup);
  }
};

export const saveVariants = (key, dict) => {
  try {
    localStorage.setItem(key, JSON.stringify(dict));
  } catch {
    /* ignore */
  }
};

/**
 * حساب درجة الثقة (0–1) بناءً على:
 * - similarity: تطابق الاسم الخام مع الرسمي
 * - occurrences: عدد المرات التي رأينا فيها نفس الـ raw لنفس official
 * - manualCount: عدد القرارات اليدوية
 * - autoCount: عدد القرارات الآلية
 */
export const computeVariantScore = ({
  similarity = 1,
  occurrences = 1,
  manualCount = 0,
  autoCount = 0,
}) => {
  // منحنى يتجه لـ 1 مع زيادة التكرار
  const occBoost = 1 - Math.exp(-0.3 * occurrences); // 0 → 1
  const manualBoost = manualCount > 0 ? 0.15 : 0; // قرار يدوي يعطي دفعة
  const autoBoost = Math.min(autoCount * 0.03, 0.15);

  let score = 0.6 * similarity + 0.3 * occBoost + manualBoost + autoBoost;
  if (score > 1) score = 1;
  if (score < 0) score = 0;
  return Number(score.toFixed(3));
};

/**
 * 🔹 learnVariant – نسخة أذكى مع نظام احتمالي
 *
 * options:
 * - source: 'manual' | 'auto'  (افتراضي manual لأنك تستدعيه من قرار المستخدم)
 * - similarityHint: لو عندك درجة جاهزة من matcher تقدر تمرّرها
 */
export const learnVariant = (
  raw,
  official,
  variantsDict,
  key,
  options = {}
) => {
  const n = normalizeName(raw);
  if (!n || !official) return variantsDict;

  const existingRaw = variantsDict[n];
  const existing =
    typeof existingRaw === "string"
      ? {
          official: existingRaw,
          occurrences: 1,
          confirmed: false,
          manualCount: 0,
          autoCount: 0,
          score: 0,
          lastSeenAt: null,
        }
      : existingRaw || null;

  const source = options.source || "manual";
  const isManual = source === "manual";

  const occurrences = (existing?.occurrences || 0) + 1;
  const manualCount = (existing?.manualCount || 0) + (isManual ? 1 : 0);
  const autoCount = (existing?.autoCount || 0) + (!isManual ? 1 : 0);

  const similarity =
    typeof options.similarityHint === "number"
      ? options.similarityHint
      : fuzzyMatchScore(n, normalizeName(official)) || 1;

  const score = computeVariantScore({
    similarity,
    occurrences,
    manualCount,
    autoCount,
  });

  const confirmed =
    existing?.confirmed || isManual || score >= 0.92 || occurrences >= 3;

  const updated = {
    ...variantsDict,
    [n]: {
      official,
      occurrences,
      confirmed,
      manualCount,
      autoCount,
      score,
      lastSeenAt: new Date().toISOString(),
    },
  };

  saveVariants(key, updated);
  return updated;
};

/**
 * دمج آمن للمعطيات (مثلاً عند import/json خارجي)
 */
export const mergeAliasDict = (current = {}, incoming = {}) => {
  const merged = { ...upgradeVariantDict(current) };
  const incomingUp = upgradeVariantDict(incoming);

  Object.entries(incomingUp).forEach(([k, v]) => {
    const existing = merged[k];
    if (!existing) {
      merged[k] = v;
    } else {
      const official =
        v.official || existing.official || v.official;

      const occurrences =
        (existing.occurrences || 1) + (v.occurrences || 1);
      const manualCount =
        (existing.manualCount || 0) + (v.manualCount || 0);
      const autoCount =
        (existing.autoCount || 0) + (v.autoCount || 0);

      const similarity = 1; // نفترض نفس الرسمية
      const score = Math.max(
        existing.score || 0,
        v.score || 0,
        computeVariantScore({ similarity, occurrences, manualCount, autoCount })
      );

      const confirmed =
        existing.confirmed ||
        v.confirmed ||
        score >= 0.92 ||
        occurrences >= 3;

      merged[k] = {
        official,
        occurrences,
        manualCount,
        autoCount,
        score,
        confirmed,
        lastSeenAt: existing.lastSeenAt || v.lastSeenAt || null,
      };
    }
  });

  return merged;
};

/**
 * 🔥 learningEngine – محرك تعلم موحّد للبنوك/الموردين
 *
 * مثال الاستخدام (داخل App.jsx مستقبلاً):
 *
 * const suppliersEngine = createLearningEngine({
 *   storageKey: SUPPLIER_VARIANTS_KEY,
 *   defaultRecords: SUPPLIER_VARIANTS_SEEDED.records,
 *   officialLookup: SUPPLIER_OFFICIAL_LOOKUP,
 *   entityType: "supplier",
 * });
 *
 * ثم:
 * suppliersEngine.learnManual(selectedRecord.supplierRaw, supplierOfficial);
 */
export const createLearningEngine = ({
  storageKey,
  defaultRecords = [],
  officialLookup = {},
  entityType = "generic", // "bank" | "supplier"
} = {}) => {
  let dict = loadVariants(storageKey, defaultRecords, officialLookup);

  return {
    getAll: () => dict,
    getForRaw: (raw) => dict[normalizeName(raw)] || null,

    learnManual: (raw, official) => {
      dict = learnVariant(raw, official, dict, storageKey, {
        source: "manual",
      });
      return dict;
    },

    learnAuto: (raw, official, similarityHint) => {
      dict = learnVariant(raw, official, dict, storageKey, {
        source: "auto",
        similarityHint,
      });
      return dict;
    },

    exportSnapshot: () => ({
      storageKey,
      entityType,
      exportedAt: new Date().toISOString(),
      variants: dict,
    }),
  };
};
________________________________________
كيف يندمج هذا مع الكود الحالي؟
في App.jsx (أقرب تعديل واضح):
الاستدعاءات الحالية:
setBankVariants((dict) =>
  learnVariant(selectedRecord.bankRaw, bankOfficial, dict, BANK_VARIANTS_KEY)
);

setSupplierVariants((dict) =>
  learnVariant(selectedRecord.supplierRaw, supplierOfficial, dict, SUPPLIER_VARIANTS_KEY)
);
تبقى كما هي 100٪ – لكن الآن:
•	كل قرار مستخدم:
o	يزيد manualCount
o	يرفع score
o	يضبط confirmed = true غالبًا من أول مرة
والـ matching:
•	resolveBank و resolveSupplierValue:
o	يقرؤون score و confirmed
o	يفهمون variants كـ تعلم حقيقي
o	يرجعون probability لو حبيت تستخدمه في الواجهة.

