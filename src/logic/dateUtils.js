import { formatDateValue } from "./normalization";

export const parseDateValue = (value) => {
  if (!value && value !== 0) return null;
  const num = Number(value);
  let dateObj = null;
  if (!Number.isNaN(num) && num > 59) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    dateObj = new Date(excelEpoch.getTime() + num * 86400 * 1000);
  } else {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      dateObj = parsed;
    }
  }
  return dateObj;
};

export const addOneYear = (value) => {
  const dateObj = parseDateValue(value);
  if (!dateObj) return null;
  const d = new Date(dateObj.getTime());
  d.setFullYear(d.getFullYear() + 1);
  return d;
};

export const toDisplayOneYear = (value) => {
  const extended = addOneYear(value);
  return extended ? formatDateValue(extended.toISOString()) : null;
};
