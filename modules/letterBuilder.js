const TEMPLATE_URL = "templates/letter_template.html";

const FALLBACK_TEMPLATE = `
<!doctype html>
<html lang="ar" dir="rtl">
<head><meta charset="UTF-8" /><title>خطاب ضمان</title></head>
<body>
السادة / {{bank_display}}<br />
المحترمين<br /><br />
الموضوع: طلب تمديد الضمان البنكي رقم ({{guarantee_number_display}}) والعائد للعقد رقم ({{contract_number_display}})<br /><br />
على حساب {{supplier_display}}، بمبلغ ({{amount_display}}) ريال سعودي حتى تاريخ ({{renewal_date_display}}).<br /><br />
{{sender_name}}<br />{{sender_position}}<br />{{department_name}}<br />{{hospital_name}}
</body></html>`;

export async function loadTemplate() {
  try {
    const res = await fetch(TEMPLATE_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("template fetch failed");
    return await res.text();
  } catch {
    return FALLBACK_TEMPLATE;
  }
}

function formatAmount(value) {
  if (value === null || value === undefined) return "";
  const num = Number(String(value).replace(/,/g, "").replace(/[^\d.]/g, ""));
  if (Number.isNaN(num)) return String(value);
  return new Intl.NumberFormat("ar-SA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num) + " ريال";
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value || "");
  const formatter = new Intl.DateTimeFormat("ar-SA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  return formatter.format(date) + "م";
}

export function renderLetter(data, templateHtml) {
  const bank = data.bank_match?.officialName || data.bank_raw || "";
  const supplier = data.supplier_match?.officialName || data.supplier_raw || "";
  const contentMap = {
    bank_display: bank,
    supplier_display: supplier,
    guarantee_number_display: data.guarantee_no || "",
    contract_number_display: data.contract_no || "",
    amount_display: formatAmount(data.amount_raw),
    renewal_date_display: formatDate(data.renewal_date_raw),
    sender_name: data.sender_name || "",
    sender_position: data.sender_position || "",
    department_name: data.department_name || "",
    hospital_name: data.hospital_name || "",
  };
  let html = templateHtml || FALLBACK_TEMPLATE;
  Object.entries(contentMap).forEach(([key, value]) => {
    html = html.replace(new RegExp(`{{${key}}}`, "g"), value);
  });
  return html;
}
