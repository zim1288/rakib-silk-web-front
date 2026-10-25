/**
 * Date Formatting Utilities for Silk & Fashion (Tally Khata).
 *
 * Enforces the British / South Asian standard DD/MM/YYYY (Day/Month/Year) across:
 * - Financial Transaction Ledgers
 * - Operational & System Audit Trail Logs
 * - CSV and JSON Data Exports
 */

/**
 * Formats any date input into a clean DD/MM/YYYY date string.
 *
 * @param dateInput - String, timestamp number, or Date instance.
 * @returns Formatted date string (e.g. '21/10/2026') or '-' if input is empty.
 */
export function formatDateDMY(dateInput?: string | number | Date | null): string {
  if (!dateInput) return '-';

  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    // If already in DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      return trimmed;
    }
    // If in YYYY-MM-DD
    const ymdMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (ymdMatch) {
      const [, y, m, d] = ymdMatch;
      return `${d}/${m}/${y}`;
    }
  }

  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) {
      return String(dateInput);
    }
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return String(dateInput);
  }
}

/**
 * Formats any date input into a human-readable DD/MM/YYYY hh:mm AM/PM string.
 *
 * @param dateInput - String, timestamp number, or Date instance.
 * @returns Formatted timestamp string (e.g. '21/10/2026 10:45 PM') or '-' if input is empty.
 */
export function formatDateTimeDMY(dateInput?: string | number | Date | null): string {
  if (!dateInput) return '-';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) {
      return formatDateDMY(dateInput);
    }
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${day}/${month}/${year} ${formattedHours}:${minutes} ${ampm}`;
  } catch {
    return formatDateDMY(dateInput);
  }
}
