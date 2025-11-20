# وثيقة تصميم النظام — أولوية 5/5

## بنية المشروع (Folders / Files)
```
root/
│ index.html          # واجهة التحميل/القرارات/المعاينة
│ style.css
│ app.js
│
├─ modules/
│   fileLoader.js
│   excelParser.js
│   columnMapper.js
│   normalizer.js
│   dictionaryEngine.js
│   decisionUI.js
│   letterBuilder.js
│   preview.js
│
├─ dictionaries/
│   banks_official.json
│   banks_variants.json
│   suppliers_official.json
│   suppliers_variants.json
│
├─ templates/
│   letter_template.html
│
└─ saved-config/
    column_mapping.json
```

## الموديولات الرئيسية
- **fileLoader/excelParser**: قراءة الملف عبر SheetJS وتحويله إلى JSON موحّد.
- **columnMapper**: اكتشاف الأعمدة وتطبيق mapping قابل للحفظ.
- **normalizer**: تنقية الحقول (أسماء، مبالغ، تواريخ) وتوحيدها.
- **dictionaryEngine**: إدارة القواميس الرسمية والـ variants.
- **matcher**: تطبيق طبقات التطابق مع حفظ القرارات كـ variants.
- **decisionUI**: عرض الصفوف الغامضة فقط وتلقي قرارات المستخدم.
- **letterBuilder/preview**: توليد الخطاب بالعربية (RTL) وتهيئته للطباعة/التصدير PDF.

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
- LocalStorage كمصدر رئيسي للقواميس التعلمية.
- ملفات JSON للتصدير/الاستيراد (القواميس والـ column mapping) لضمان النسخ الاحتياطي والتنقل بين الأجهزة.

## اعتماديات
- SheetJS لقراءة Excel.
- متصفح حديث (Chrome/Edge) للطباعة إلى PDF.
