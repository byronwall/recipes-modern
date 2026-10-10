const FRACTIONS: [number, string][] = [
  [1 / 8, "⅛"],
  [1 / 4, "¼"],
  [1 / 3, "⅓"],
  [3 / 8, "⅜"],
  [1 / 2, "½"],
  [5 / 8, "⅝"],
  [2 / 3, "⅔"],
  [3 / 4, "¾"],
  [7 / 8, "⅞"],
];

/**
 * Render decimal ingredient amounts as kitchen fractions, e.g. "0.75" -> "¾",
 * "1.5" -> "1½", "0.33" -> "⅓". Non-numeric amounts pass through unchanged.
 */
export function formatAmount(amount: string | null | undefined) {
  const raw = (amount ?? "").trim();
  if (!/^\d*\.\d+$/.test(raw)) return raw;

  const value = Number(raw);
  const whole = Math.floor(value);
  const fraction = value - whole;
  const match = FRACTIONS.find(([v]) => Math.abs(v - fraction) < 0.02);
  if (!match) return raw;

  return `${whole > 0 ? whole : ""}${match[1]}`;
}
