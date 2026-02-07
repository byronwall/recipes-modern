export const MAX_KROGER_SEARCH_TERMS = 8;

export function getKrogerSearchTerms(term: string): string[] {
  return term
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function normalizeKrogerSearchTerm(term: string): string {
  return getKrogerSearchTerms(term)
    .slice(0, MAX_KROGER_SEARCH_TERMS)
    .join(" ");
}

