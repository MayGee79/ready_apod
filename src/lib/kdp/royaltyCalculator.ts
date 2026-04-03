type RoyaltyResult = {
  rateLabel: "70%" | "35%";
  royaltyUSD: number;
  breakEvenPriceUSD: number | null;
};

export function calculateRoyaltyUSD(input: {
  listPriceUSD: number;
  printingCostUSD: number;
}): RoyaltyResult {
  const price = Number.isFinite(input.listPriceUSD) ? Math.max(0, input.listPriceUSD) : 0;
  const printing = Number.isFinite(input.printingCostUSD)
    ? Math.max(0, input.printingCostUSD)
    : 0;

  const qualifiesFor70 = price >= 2.99 && price <= 9.99;
  if (qualifiesFor70) {
    const royalty = roundToCents(price * 0.7 - printing);
    return {
      rateLabel: "70%",
      royaltyUSD: royalty,
      breakEvenPriceUSD: ceilToCents(printing / 0.7),
    };
  }

  return {
    rateLabel: "35%",
    royaltyUSD: roundToCents(price * 0.35),
    breakEvenPriceUSD: null,
  };
}

function roundToCents(n: number) {
  return Math.round(n * 100) / 100;
}

function ceilToCents(n: number) {
  return Math.ceil(n * 100) / 100;
}

