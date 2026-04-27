export function toTitleCase(value: string) {
  const normalized = value
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");

  if (!normalized) return "";

  return normalized
    .split(" ")
    .map((word) => {
      const lower = word.toLocaleLowerCase();
      return lower.replace(/^\p{L}/u, (letter) => letter.toLocaleUpperCase());
    })
    .join(" ");
}

export function normalizeAisleName(value: string | null | undefined) {
  if (!value) return null;
  return toTitleCase(value) || null;
}
