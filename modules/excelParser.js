// تحويل الـ workbook إلى صفوف خام باستخدام SheetJS
// يفترض أن الورقة الأولى هي المصدر الأساسي.
export function parseWorkbookToRawRows(workbook) {
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, {
    defval: "",
    raw: false,
    trim: true,
  });
  return rows;
}
