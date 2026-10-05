export function krogerPurchaseNote(note: string | null): string | null {
  if (note?.startsWith("Kroger cart request failed: HTTP 401")) {
    return "This attempt was not added because the Kroger connection expired.";
  }
  return note;
}
