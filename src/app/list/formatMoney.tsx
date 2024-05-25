export function formatMoney(amount: number | undefined) {
  if (!amount) {
    return "N/A";
  }

  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}
