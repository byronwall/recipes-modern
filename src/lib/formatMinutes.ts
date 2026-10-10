/** Compact cook-time label, e.g. 45 -> "45 min", 240 -> "4 hr", 90 -> "1 hr 30 min". */
export function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`;
}
