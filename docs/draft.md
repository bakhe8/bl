import React, { useState } from "react";

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between text-[11px] py-0.5 border-b border-slate-50">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}

export default function GuaranteeLettersUI() {
  const [selectedRecord, setSelectedRecord] = useState(null);

  const recordsNeedingDecision = [
    {
      id: 3,
      bankRaw: "ANB",
      supplierRaw: "CURE DEV",
      guaranteeNo: "RLG6617038",
      contractNo: "C/M0007/22",
      amount: "700,000.00",
      dateRaw: "1 Oct 2025",
    },
    {
      id: 7,
      bankRaw: "SNB",
      supplierRaw: "AL HUDA TRD",
      guaranteeNo: "RLG7721903",
      contractNo: "C/M0042/23",
      amount: "150,000.00",
      dateRaw: "2025-03-10",
    },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">

      {/* HEADER */}
      <header className="w-full border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">نظام توليد خطابات تمديد الضمانات البنكية</h1>
            <p className="text-xs text-slate-500 mt-0.5">رفع ملف Excel → مراجعة سريعة → خطاب جاهز للطباعة</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button className="px-3 py-1.5 rounded-full border border-dashed border-slate-300 bg-white hover:bg-slate-50">اختيار ملف Excel</button>
            <span className="text-[11px] text-slate-500 hidden sm:inline">يعمل بدون سيرفر – داخل المتصفح فقط</span>
          </div>
        </div>
      </header>

      {/* MAIN GRID */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 py-4 flex flex-col gap-3">
        <div className="grid grid-cols-1 xl:grid-cols-[260px_260px_260px_minmax(0,1fr)] gap-3 items-start">

          {/* PANEL 1 */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3 flex flex-col gap-2 text-xs text-right">
            <h2 className="font-semibold text-slate-800 flex items-center justify-between">
              <span>الأخطاء والتنبيهات</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600">2 أخطاء</span>
            </h2>
            <div className="space-y-2">
              <div className="flex items-start gap-2"><span className="mt-0.5 text-red-500">❌</span><p>لم يتم العثور على عمود Supplier.</p></div>
              <div className="flex items-start gap-2"><span className="mt-0.5 text-amber-500">⚠️</span><p>عدد 2 صف يحتاج إلى قرار.</p></div>
              <div className="flex items-start gap-2"><span className="mt-0.5 text-red-500">❌</span><p>تاريخ غير قابل للتحليل في الصف رقم 12.</p></div>
            </div>
          </section>

          {/* PANEL 2 */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3 flex flex-col gap-2 text-xs text-right">
            <h2 className="font-semibold text-slate-800 flex items-center justify-between">
              <span>حلّ القرارات (البنك / المورد)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">صفوف غامضة</span>
            </h2>

            <div className="border border-slate-100 rounded-xl overflow-hidden mb-2">
              <table className="w-full text-[11px]">
                <thead className="bg-slate-50/80">
                  <tr className="border-b border-slate-100">
                    <th className="py-1.5 px-2">#</th>
                    <th className="py-1.5 px-2">البنك (خام)</th>
                    <th className="py-1.5 px-2">المورد (خام)</th>
                    <th className="py-1.5 px-2">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {recordsNeedingDecision.map((r, idx) => (
                    <React.Fragment key={r.id}>
                      {/* ROW */}
                      <tr
                        onClick={() => setSelectedRecord(r)}
                        className={`border-b border-slate-50 hover:bg-slate-50/80 cursor-pointer ${selectedRecord?.id === r.id ? "bg-emerald-50" : ""}`}
                      >
                        <td className="py-1.5 px-2 text-slate-500">{idx + 1}</td>
                        <td className="py-1.5 px-2 font-medium text-slate-800">{r.bankRaw}</td>
                        <td className="py-1.5 px-2 text-slate-700">{r.supplierRaw}</td>
                        <td className="py-1.5 px-2 text-amber-600">يحتاج تأكيد</td>
                      </tr>

                      {/* EXPANDED ROW */}
                      {selectedRecord?.id === r.id && (
                        <tr className="bg-emerald-50/30 border-b border-slate-200">
                          <td colSpan={4} className="p-3">
                            <div className="space-y-2 text-[11px] text-right">
                              <p className="text-slate-700 font-medium">حلّ التعارض لهذا الصف:</p>

                              {/* بنك */}
                              <div className="space-y-1.5">
                                <label className="block text-[11px] text-slate-700">اختر البنك الرسمي:</label>
                                <select className="w-full border border-slate-200 rounded-lg px-2 py-1.5 bg-white">
                                  <option>البنك العربي الوطني</option>
                                  <option>البنك الأهلي السعودي</option>
                                  <option>غير ذلك…</option>
                                </select>
                              </div>

                              {/* مورد */}
                              <div className="space-y-1.5">
                                <label className="block text-[11px] text-slate-700">اختر المورد الرسمي:</label>
                                <select className="w-full border border-slate-200 rounded-lg px-2 py-1.5 bg-white">
                                  <option>شركة كير للتطوير</option>
                                  <option>شركة كير للتقنية</option>
                                  <option>إضافة مورد جديد…</option>
                                </select>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-1 border-t border-slate-100 pt-2 space-y-2">
              {selectedRecord ? (
                <>
                  <p className="text-[11px] text-slate-600">
                    الصف المحدد:
                    <strong className="mx-1 text-slate-900">#{selectedRecord.id}</strong>
                    البنك الخام:
                    <strong className="mx-1">{selectedRecord.bankRaw}</strong>
                  </p>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] text-slate-700">اختر البنك الرسمي:</label>
                    <select className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] bg-white">
                      <option>البنك العربي الوطني</option>
                      <option>البنك الأهلي السعودي</option>
                      <option>غير ذلك…</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] text-slate-700">اختر المورد الرسمي:</label>
                    <select className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] bg-white">
                      <option>شركة كير للتطوير</option>
                      <option>شركة كير للتقنية</option>
                      <option>إضافة مورد جديد…</option>
                    </select>
                  </div>
                </>
              ) : (
                <p className="text-slate-400 text-center py-6">اضغط على أي صف…</p>
              )}
            </div>
          </section>

          {/* PANEL 3 */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3 flex flex-col gap-2 text-xs text-right">
            <h2 className="font-semibold text-slate-800 flex items-center justify-between">
              <span>تفاصيل السجل</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-500">عرض فقط</span>
            </h2>

            <div className="space-y-1.5">
              {selectedRecord ? (
                <>
                  <InfoRow label="رقم الضمان" value={selectedRecord.guaranteeNo} />
                  <InfoRow label="رقم العقد" value={selectedRecord.contractNo} />
                  <InfoRow label="البنك (خام)" value={selectedRecord.bankRaw} />
                  <InfoRow label="المورد (خام)" value={selectedRecord.supplierRaw} />
                </>
              ) : (
                <p className="text-slate-400 text-center py-6">لا يوجد سجل محدد…</p>
              )}
            </div>
          </section>

          {/* PANEL 4 – Letter Preview */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3 flex flex-col gap-2 text-xs text-right col-span-1 xl:col-span-1">
            <h2 className="font-semibold text-slate-800 flex items-center justify-between">
              <span>معاينة الخطاب</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">جاهز للطباعة</span>
            </h2>
            <div className="bg-white border border-slate-100 rounded-xl p-4 text-[12px] leading-relaxed h-[400px] overflow-auto">
              {selectedRecord ? (
                <div>
                  <p>السادة / البنك الرسمي</p>
                  <p>المحترمين،</p>
                  <br />
                  <p>الموضوع: طلب تمديد الضمان البنكي رقم ({selectedRecord.guaranteeNo})</p>
                  <br />
                  <p>
                    إشارة إلى الضمان البنكي الصادر منكم لصالح مستشفى الملك فيصل التخصصي، وبناءً على المعلومات
                    التالية:
                  </p>
                  <ul className="list-disc pr-5 mt-2 text-[11px] text-slate-700">
                    <li>رقم العقد: {selectedRecord.contractNo}</li>
                    <li>المبلغ: {selectedRecord.amount} ريال</li>
                    <li>اسم المورد: {selectedRecord.supplierRaw}</li>
                  </ul>
                  <br />
                  <p>نأمل منكم التكرم بتمديد تاريخ الضمان المشار إليه.</p>
                </div>
              ) : (
                <p className="text-slate-400 text-center py-20">اختر صفًا من لوحة القرارات لعرض المعاينة…</p>
              )}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
