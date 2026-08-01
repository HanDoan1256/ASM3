export function sanitizeVietnamPhone(input: string): string {
  const prefix = "+84 ";
  let rawDigits = input.replace(/\D/g, "");

  if (rawDigits.startsWith("84")) {
    rawDigits = rawDigits.slice(2);
  }

  const remainingDigits = rawDigits.slice(0, 9);
  return `${prefix}${remainingDigits}`;
}
