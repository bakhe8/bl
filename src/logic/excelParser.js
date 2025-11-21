import * as XLSX from "xlsx";
import { normalizeKey } from "./normalization";

const pick = (row, keys) => {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") {
      return row[key];
    }
  }
  return "";
};

const pickLoose = (row, needles, exclude = []) => {
  for (const [k, v] of Object.entries(row)) {
    if (!v || String(v).trim() === "") continue;
    const lowerKey = k.toLowerCase();
    if (exclude.some((ex) => lowerKey.includes(ex))) continue;
    if (needles.some((n) => lowerKey.includes(n))) return v;
  }
  return "";
};

export const mapRows = (rawRows) =>
  rawRows.map((row, idx) => {
    const keys = Object.fromEntries(Object.entries(row).map(([k, v]) => [normalizeKey(k), v]));
    const guaranteeVal =
      pick(keys, ["guarantee no", "guarantee", "bond_no", "bond no", "bank guarantee number", "رقم الضمان"]) ||
      pickLoose(keys, ["guarantee", "bond", "bg"]);
    const contractVal =
      pick(keys, ["contract", "contract no", "contract number", "contract #", "رقم العقد"]) ||
      pickLoose(keys, ["contract"], ["contractor"]) ||
      pickLoose(keys, ["عقد", "عقود"]);
    const dateVal =
      // أولوية صريحة لـ VALIDITY DATE إن وجدت
      pick(keys, [
        "validity date",
        "validity",
        "valid to",
        "date",
        "expiry",
        "expiration",
        "renewal",
        "renewal date",
        "renewaldate",
        "expiry date",
        "exp date",
        "expiration date",
        "end date",
        "تاريخ التمديد",
        "تاريخ الانتهاء",
        "تاريخ انتهاء",
      ]) || pickLoose(keys, ["validity", "expiry", "expiration", "renewal", "valid", "انتهاء", "تمديد"]);

    return {
      id: idx + 1,
      bankRaw: pick(keys, ["bank", "bank name", "اسم البنك", "البنك"]),
      supplierRaw: pick(keys, ["supplier", "vendor", "اسم المورد", "المورد", "المتعهد", "contractor name"]),
      guaranteeNo: guaranteeVal,
      contractNo: contractVal,
      amount: pick(keys, ["amount", "value", "amount sar", "المبلغ"]),
      dateRaw: dateVal,
    };
  });

export const readExcelFile = async (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const wb = XLSX.read(data, { type: "array" });
        const sheet = wb.SheetNames[0];
        if (!sheet) throw new Error("EMPTY");
        const rawRows = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { defval: "" });
        resolve(rawRows);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
