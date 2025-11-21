# وثيقة تصميم النظام — أولوية 5/5

## بنية المشروع (Folders / Files)
```
root/
│ index.html             # نقطة دخول Vite
│ vite.config.js
│ package.json
│ run-dev.ps1            # تشغيل dev server على 5173 مع تنظيف Vite القديم
│
├─ src/
│   App.jsx              # واجهة واحدة للتحميل/القرارات/المعاينة
│   index.css
│   data/
│     dictionaries/
│       banks.json               # قاموس البنوك الرسمي (ثابت – إصدار 2 بجميع الاختصارات/الأخطاء الشائعة) ← راجع [dictionaries.md](dictionaries.md)
│       suppliers.json           # قاموس الموردين الرسمي (عربي)
│       variants_suppliers.json  # بذرة variants للموردين
│     banks.js                   # تحميل القاموس الرسمي للبنوك
│     suppliers.js               # تحميل الموردين + بذرة variants
│   utils/
│     normalize.js
│     bankMatch.js               # مطابقة البنوك الرسمية فقط (no learning)
│     variants.js                # تعلّم الموردين (LocalStorage)
│
├─ templates/
│   letter_template.html
│
└─ docs/                         # ملفات التوثيق
```

## الموديولات الرئيسية
- **Excel Loader**: SheetJS لتحويل الملف إلى JSON موحّد.
- **Normalizer**: تنظيف الحقول (أسماء/تواريخ/مبالغ) وتوحيد الهمزات/المسافات.
- **Bank Matcher**: تطابق البنوك ضد القاموس الرسمي + اختصاراته فقط، بدون تعلّم.
- **Supplier Matcher/Learning**: تطابق الموردين (رسمي → variants → Fuzzy) مع تخزين variants في LocalStorage.
- **Decision UI**: عرض الصفوف الغامضة وتثبيت قرارات الموردين فقط.
- **Letter Builder/Preview**: توليد الخطاب بالعربية (RTL) وتهيئته للطباعة/التصدير PDF.

## التدفق العام
Upload Excel → Parse → Normalize → Match → Decision UI → Letter Builder → Preview → Print

## تدفق البيانات (Data Flow)
1) رفع ملف Excel.
2) التحويل إلى JSON داخلي.
3) تنظيف الحقول وتوحيدها.
4) تطابق مع القواميس (رسمي → variants → قرار يدوي).
5) قرارات المستخدم تُحفظ كـ variants وتُحدّث القواميس.
6) توليد الخطاب بقالب ثابت وجاهز للطباعة.

## تدفق الواجهة (UI Flow)
- شاشة التحميل → شاشة القرارات (فقط الصفوف الغامضة) → شاشة عرض الخطاب/الطباعة.

## التخزين
- البنوك: قراءة فقط من `banks.json` (لا LocalStorage).
- الموردون: LocalStorage (`bgl_supplier_variants`) + بذرة `variants_suppliers.json`. التعلم محلي للجلسة/المتصفح؛ يمكن تصدير/استيراد يدوي من Console إذا لزم.
- الترقية: عند تغيير شكل القاموس/المابينغ، تُطبَّق ترقية للصيغة الجديدة مع الاحتفاظ بنسخة احتياطية.

## نقاط التعقيم (Sanitize Pipeline Points)
- عند القراءة من Excel: تطبيع/تعقيم قبل التخزين.
- قبل عرض جدول القرارات: ترميز/تعقيم النصوص الخام.
- قبل الحقن في قالب الخطاب: تعقيم placeholders لضمان خلوّها من HTML.

## اعتماديات
- SheetJS لقراءة Excel.
- متصفح حديث (Chrome/Edge) للطباعة إلى PDF.
- طبقة حماية عرض: تعقيم/ترميز القيم قبل حقنها في DOM لمنع XSS عند استعراض بيانات Excel.
- استخدم دالة sanitize (مثل: `text.replace(/[<>]/g, "")`) لأي نص خام قبل العرض.

## نقاط التعقيم (Sanitize Pipeline Points)
- بعد القراءة والتطبيع من Excel: تعقيم القيم قبل تخزينها في الذاكرة.
- قبل عرضها في جدول القرارات: ترميز/تعقيم لكل خلية تعرض محتوى Excel الخام.
- قبل الحقن في `letter_template.html`: تعقيم placeholders لضمان خلوّها من رموز HTML.
