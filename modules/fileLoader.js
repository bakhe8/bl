// تحميل ملف Excel كـ ArrayBuffer ثم تحويله إلى workbook باستخدام SheetJS
export async function loadExcelFile(file) {
  if (typeof XLSX === "undefined") {
    throw new Error("NO_SHEETJS");
  }

  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  return workbook;
}
