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

export function getKrogerIngredientQuery(ingredient: string): string {
  const query = ingredient
    .replace(/\([^)]*\)/g, " ")
    .split(/\s+or\s+|,/i)[0]!
    .replace(/^\s*[\d./¼½¾⅓⅔⅛⅜⅝⅞–-]+(?:\s+[\d./¼½¾⅓⅔⅛⅜⅝⅞–-]+)*\s+/, "")
    .replace(
      /^(?:cups?|tablespoons?|tbsp|teaspoons?|tsp|pounds?|lbs?|ounces?|oz|grams?|g|kilograms?|kg|milliliters?|ml|liters?|l|cloves?|cans?|bags?|packages?|pinch)\b\.?\s*/i,
      "",
    )
    .replace(
      /(?:\s+(?:finely|roughly|chopped|diced|minced|grated|shredded|melted|divided|peeled))+\s*$/i,
      " ",
    )
    .replace(/\b(?:short|long)\s+pasta\b/gi, "pasta");

  return getKrogerSearchTerms(query).join(" ") || ingredient.trim();
}
