/**
 * Formats milliseconds into a human-readable time string (MM:SS or HH:MM:SS).
 * @param millis The duration in milliseconds.
 * @returns A formatted time string.
 */
export function formatPlayerTime(millis: number): string {
  if (isNaN(millis)) {
    return '00:00';
  }

  const totalSeconds = Math.floor(millis / 1000);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);

  const paddedSeconds = seconds.toString().padStart(2, '0');
  const paddedMinutes = minutes.toString().padStart(2, '0');

  if (hours > 0) {
    const paddedHours = hours.toString().padStart(2, '0');
    return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
  }

  return `${paddedMinutes}:${paddedSeconds}`;
}
