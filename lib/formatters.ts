import { formatDistanceToNowStrict } from 'date-fns';

/**
 * Formats a number into a compact, human-readable string.
 * e.g., 1000 -> 1k, 1500 -> 1.5k, 1000000 -> 1M
 * @param num The number to format.
 * @returns A compact string representation of the number.
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
}

/**
 * Formats a date into a compact, relative time string.
 * e.g., "1 minute ago" -> "1 min ago", "7 days ago" -> "7 day ago"
 * @param date The date to format.
 * @returns A compact string representation of the relative time.
 */
export function formatCompactDate(date: Date | string | number): string {
  if (!date) return '';
  const dateObj = new Date(date);
  // Using `formatDistanceToNowStrict` to avoid "about", "almost", etc.
  const result = formatDistanceToNowStrict(dateObj, { addSuffix: true });
  
  // Apply custom shortening rules based on user examples
  return result
    .replace(/ seconds? ago/, ' sec ago')
    .replace(/ minutes? ago/, ' min ago')
    .replace(/ hours? ago/, ' h ago')
    .replace(/ days? ago/, ' day ago')
    .replace(/ weeks? ago/, ' week ago')
    .replace(/ months? ago/, ' month ago')
    .replace(/ years? ago/, ' year ago');
}
