# خطة ترقية محرك الموردين (Suppliers Engine)

هذا الملخص يدمج محتوى مجلد `docs/suppliers_upgrade/` في وثيقة واحدة قابلة للتنفيذ، مع خطوات واضحة وما يجب إنتاجه من ملفات.

## 1) الهدف
- بناء قاموس موحّد للموردين `suppliers_canonical.json` يجمع الرسمي + aliases + counts.
- تطبيع قوي للأسماء (عربي/إنجليزي) دون حذف كلمات الكيان القانونية.
- مطابقة تعتمد Jaro-Winkler: exact → alias → fuzzy auto ≥ 0.9 → fuzzy suggest ≥ 0.8 → manual.
- تعلّم للموردين فقط (LocalStorage variants) مع score/occurrences/manual/auto/status، وبذور من `suppliers_index.json`.

## 2) مدخلات البيانات (الموجودة في `docs/suppliers_upgrade/`)
- `companies.json`: الأسماء الرسمية من النظام.
- `companies_cleaned.json`: نسخة منظّفة (إزالة التكرار/التباين الإملائي).
- `suppliers_index.json`: تعلّم تاريخي (canonical + aliases + count).
- الملفات التوضيحية: `README.MD`, `info.md` (مضمّنة هنا).

## 3) التطبيع (normalizeName للموردين)
- توحيد الحروف العربية (أ/إ/آ → ا، ة→ه، ى→ي) وإزالة التشكيل والتطويل.
- إبقاء كلمات الكيان (شركة/مؤسسة/المحدودة/ذ.م.م) وعدم حذفها.
- إزالة الرموز إلى مسافة، lowercase، دمج مسافات، دعم رقمية عربية-هندية.

## 4) بناء القاموس الموحّد (offline)
1. ابدأ بـ `companies_cleaned.json` كمصدر أساس:
   ```json
   { canonical, normalized, aliases: [], normalizedAliases: [], totalCount: 0 }
   ```
2. أضف أي أسماء غير موجودة من `companies.json`.
3. ادمج `suppliers_index.json`:
   - مطابق normalized(canonical) → أضف aliases + زِد totalCount.
   - وإلا أضف سجلًا جديدًا بنفس البنية مع aliases و count.
4. احفظ الناتج في `suppliers_canonical.json` (يوضع في `src/data/dictionaries/`).

## 5) المطابقة (matching)
- دالة `fuzzyMatchScore` (Jaro-Winkler على normalized strings).
- `resolveSupplier(raw, canonicalList, variantsDict)` يعيد:
  - status: auto/fuzzy/manual
  - official / fuzzySuggestion
  - probability
  - source: canonical-exact | alias-exact | canonical-fuzzy-auto | canonical-fuzzy-suggest | variant-...
  - candidates? (اختياري لأفضل 3).
- منطق: exact official → alias (variants confirmed) → fuzzy على canonicalList (≥0.9 auto، ≥0.8 suggest) → manual.

## 6) التعلّم (learning)
- LocalStorage key: `bgl_supplier_variants`.
- حقل variant: `{ official, occurrences, confirmed, manualCount, autoCount, score, status, lastSeenAt }`.
- score يعتمد similarity + occurrences + manual/auto boosts.
- status: tentative → semi → confirmed → permanent (بناءً على score/occurrences/manual).
- بذور التعلم: حمّل من `suppliers_index.json` كـ variants confirmed (score ≈ 0.95).
- دوال: `loadVariants`, `saveVariants`, `computeVariantScore`, `learnSupplier`, `createSuppliersEngine`.

## 7) ربط الواجهة
- عند التحليل: supplierRaw → resolveSupplier → تخزين status/probability/learnStatus/official.
- عند قرار المستخدم: learnSupplier(raw, official, { source: "manual" }).
- البنوك تبقى ثابتة بالقاموس الرسمي (بلا تعلّم).

## 8) مخرجات مطلوبة
- `src/data/dictionaries/suppliers_canonical.json` (التجميع offline).
- كود التطبيع/المطابقة/التعلّم مخصّص للموردين فقط في src/logic/.
- تحديث الوثائق الرئيسة للإشارة إلى القاموس الجديد وخطوات التعلّم (دون خلط مع البنوك).

## 9) ملاحظات تعاقدية
- لا حذف لكلمات الكيان من الأسماء.
- التعلّم للموردين فقط؛ البنوك ثابتة.
- يمكن إبقاء ملفات المصدر في `docs/suppliers_upgrade/` كمرجع تاريخي، مع الاعتماد على `suppliers_canonical.json` في التشغيل.
