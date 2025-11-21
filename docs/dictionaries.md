# وثيقة القواميس — أولوية 5/5

القواميس هي “العقل” الذي يضمن تطابق أسماء البنوك والموردين بدقة ثابتة، مع طبقة تعلّم محلية (LocalStorage) للـ aliases دون المساس بالأسماء الرسمية.

## أنواع القواميس
- **القواميس الرسمية** (JSON ثابت):
- البنوك: `src/data/dictionaries/banks.json` — ثابتة 100%، تحوي `official` (عربي) و`short[]` للاختصارات EN. لا تعلّم ولا Aliases. (راجع [system_design.md](system_design.md))
- الموردون: `src/data/dictionaries/suppliers.json` — الأسماء العربية الرسمية فقط.
- **القواميس التعلمية (الموردون فقط)**:
  - الموردون: LocalStorage تحت المفتاح `bgl_supplier_variants` + بذرة `src/data/dictionaries/variants_suppliers.json` (تُحمّل عند البدء).
  - هدف التعلّم: إضافة صيغ خام للمورد → اسم رسمي عربي، دون تعديل الاسم الرسمي نفسه.

## منظومة التعلّم (الموردون فقط)
- التخزين: LocalStorage في `bgl_supplier_variants` (لا يوجد أي تخزين للبنوك).
- الترقية: كل alias يملك الحقول: `official`, `occurrences`, `manualCount`, `autoCount`, `score`, `status`, `lastSeenAt`.
- حالات التعلّم: `tentative` → `semi` → `confirmed` → `permanent` (تترقى عند ارتفاع score أو التكرار).
- الاحتساب: `score` يعتمد على التشابه (Jaro-Winkler) + التكرار + القرارات اليدوية.
- الرفض: أي اسم عشوائي أو قصير جدًا يُرفض قبل التعلّم للحفاظ على جودة القاموس.
- الدمج: `mergeAliasDict` يدمج التعلم الوارد (مثلاً من Console) مع الحفاظ على الاسم الرسمي وعدم الكتابة فوقه.

## قواعد التطبيع (Normalization)
- الإنجليزية: إلى lowercase، دمج المسافات، Jaro-Winkler للكلمات بدل المقارنة الحرفية.
- العربية: دمج المسافات، توحيد الهمزات/الياء/التاء المربوطة، إزالة التشكيل والتطويل، تحويل الأرقام العربية-الهندية.
- لا ترجمة ولا حذف كلمات؛ التنظيف لتوحيد الشكل دون تغيير المعنى.

## التخزين
- البنوك: قراءة فقط من `banks.json` (لا تعلّم ولا حفظ محلي).
- الموردون: قراءة من `suppliers.json` + بذرة + تعلّم محلي في `bgl_supplier_variants`.
- حد تشغيلي مقترح لـ LocalStorage: 4MB؛ تحذير عند 3.6MB.
- نسخة احتياطية: يمكن تصدير LocalStorage ودمجها مع ملفات JSON عند الحاجة (يدوياً).

## شكل بيانات (مستخدم حالياً)
- `banks.json`:
```json
{ "version":1,"banks":[{"id":"bank_001","official":"البنك العربي الوطني","short":["ANB","ARAB NATIONAL BANK"]}] }
```

- `suppliers.json`:
```json
{ "version":1,"suppliers":[{"id":"sup_001","official":"شركة كير للتطوير"}] }
```

- `variants_suppliers.json` (بذرة):
```json
{ "records":[{"raw":"CURE DEV","clean":"cure dev","officialId":"sup_001","occurrences":3,"confirmed":true}] }
```
- شكل التخزين بعد التعلم (banks/suppliers) في LocalStorage:
```json
"cure dev": {
  "official": "شركة كير للتطوير",
  "occurrences": 3,
  "confirmed": true,
  "status": "confirmed", // tentative | semi | confirmed | permanent
  "manualCount": 1,
  "autoCount": 0,
  "score": 0.95,
  "lastSeenAt": "2025-11-21T20:00:00.000Z"
}
```

## آلية العمل
1) البنوك: تطابق رسمي/اختصار فقط + Fuzzy Jaro-Winkler ≥0.9 (لا تعلّم للبنوك).
2) الموردون: تطابق رسمي، ثم aliases المتعلمة، ثم Fuzzy Jaro-Winkler (≥0.9 تلقائي، 0.8–0.89 اقتراح).
3) إضافة variant (للمورد فقط): بعد موافقة المستخدم؛ يحتسب score اعتمادًا على التشابه + التكرار + القرارات اليدوية، ويُعتبر مؤكدًا عند score ≥0.92 أو تكرار ≥3.

## إضافة/تحديث
- البنوك: تعديل `banks.json` للاسم الرسمي فقط؛ لا يوجد تعلم للبنوك.
- الموردون: إضافة رسمية عبر `suppliers.json`، أو تعلم variant بعد موافقة المستخدم. ترقية variant تعتمد score (≥0.92) أو تكرار ≥3.

## مبادئ
- لا حذف إلا للمتأكد أنه خطأ.
- احتفظ باللغة/المصدر.
- عند تعارض، لا اعتماد تلقائي؛ اعرض القرار للمستخدم وسجّل اختياره.
