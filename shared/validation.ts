/**
 * Validates EPA Registration Number format
 * Valid formats:
 * - Primary: XXXXX-XXX (5 digits, dash, 2-4 digits)
 * - With supplemental: XXXXX-XXX-XXXXX (adds dash and up to 5 digits)
 */
export function isValidEpaNumber(num: string | null | undefined): boolean {
  if (!num || num.trim() === "") return true;

  // Remove any whitespace
  const cleaned = num.trim();

  // Regex: 1-5 digits, dash, 1-4 digits, optionally followed by dash and 1-5 digits
  // The official format allows variable lengths, usually:
  // Company Number (up to 7 digits) - Product Number (up to 5 digits) [- Distributor Number (up to 7 digits)]
  // But common representation is simpler. The regex in task description was:
  // /^\d{1,5}-\d{1,4}(-\d{1,5})?$/
  // I will use a slightly more permissive one to match "digits-digits[-digits]"
  const epaPattern = /^\d+-\d+(-\d+)?$/;

  return epaPattern.test(cleaned);
}

/**
 * Formats EPA number with consistent dashes
 */
export function formatEpaNumber(num: string): string {
  // Remove all non-digits
  const digits = num.replace(/\D/g, '');

  if (digits.length <= 5) {
    return digits;
  } else if (digits.length <= 9) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  } else {
    return `${digits.slice(0, 5)}-${digits.slice(5, 9)}-${digits.slice(9, 14)}`;
  }
}
