import React from "react";

export function LetterPreview({ record }) {
  const bankName = record?.bankDisplay || record?.bankOfficial || record?.bankRaw || "البنك الرسمي";
  const supplierName =
    record?.supplierDisplay || record?.supplierOfficial || record?.supplierRaw || "المورد";
  const guaranteeNo = record?.guaranteeNumber || record?.guaranteeNo || record?.guarantee_no || "-";
  const contractNo = record?.contractNumber || record?.contractNo || record?.contract_no || "-";
  const amount = record?.amount || "-";
  const renewalDate = record?.renewalDateDisplay || record?.dateRaw || "غير محدد";

  return (
    <div className="warning-list">
      <p>السادة / {bankName}</p>
      <p>المحترمين،</p>
      <p>
        الموضوع: طلب تمديد الضمان البنكي رقم ({guaranteeNo}) والعائد للعقد رقم ({contractNo})
      </p>
      <p>إشارة إلى الضمان البنكي الصادر منكم لصالح مستشفى الملك فيصل التخصصي، وبناءً على المعلومات التالية:</p>
      <ul>
        <li>المبلغ: {amount}</li>
        <li>اسم المورد: {supplierName}</li>
      </ul>
      <p>نأمل منكم التكرم بتمديد تاريخ الضمان المشار إليه حتى تاريخ {renewalDate}.</p>
    </div>
  );
}
