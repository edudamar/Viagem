export function maskCurrency(value: string): string {
  const raw = value.replace(/[^\d,]/g, "");
  const parts = raw.split(",");
  if (parts.length > 2) return parts[0] + "," + parts.slice(1).join("").slice(0, 2);
  if (parts.length === 2) {
    const intPart = parts[0].replace(/^0+(?=\d)/, "");
    const decPart = parts[1].slice(0, 2);
    if (!intPart && !decPart) return "";
    const formatted = intPart ? parseInt(intPart, 10).toLocaleString("pt-BR") : "0";
    return formatted + "," + decPart;
  }
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const num = parseInt(digits, 10);
  return num.toLocaleString("pt-BR");
}

export function blurCurrency(value: string): string {
  if (!value) return "";
  if (value.includes(",")) return value;
  return value + ",00";
}

export function focusCurrency(e: React.FocusEvent<HTMLInputElement>) {
  const v = e.target.value;
  if (v) {
    e.target.select();
  } else {
    e.target.setSelectionRange(0, 0);
  }
}

export function parseCurrency(value: string): number {
  if (!value) return 0;
  const normalized = value.replace(/\./g, "").replace(",", ".");
  return parseFloat(normalized) || 0;
}

export function maskDate(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return digits.slice(0, 2) + "/" + digits.slice(2);
  return digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
}

export function parseDate(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length < 8) return "";
  return digits.slice(4, 8) + "-" + digits.slice(2, 4) + "-" + digits.slice(0, 2);
}

export function unmaskDate(iso: string): string {
  if (!iso || iso.length < 10) return "";
  const [y, m, d] = iso.split("-");
  return d + "/" + m + "/" + y;
}

export function maskTime(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + ":" + digits.slice(2);
}

export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return "(" + digits;
  if (digits.length <= 7) return "(" + digits.slice(0, 2) + ") " + digits.slice(2);
  return "(" + digits.slice(0, 2) + ") " + digits.slice(2, 7) + "-" + digits.slice(7);
}

export function maskCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return digits.slice(0, 3) + "." + digits.slice(3);
  if (digits.length <= 9) return digits.slice(0, 3) + "." + digits.slice(3, 6) + "." + digits.slice(6);
  return digits.slice(0, 3) + "." + digits.slice(3, 6) + "." + digits.slice(6, 9) + "-" + digits.slice(9);
}
