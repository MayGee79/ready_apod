export function formatCurrencyUSD(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : NaN;
  if (!Number.isFinite(safe)) return "—";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe);
}

