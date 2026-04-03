export type PaperType = "white" | "cream" | "colour";
export type BindingType = "paperback" | "hardcover";
export type InteriorInk = "bw" | "color";
export type Marketplace = "us";

const US_PAPERBACK_BW_FIXED_COST = 0.85;
const US_PAPERBACK_BW_PER_PAGE: Record<Exclude<PaperType, "colour">, number> = {
  white: 0.012,
  cream: 0.012,
};

export function calculatePrintingCostUSD(input: {
  pageCount: number;
  paperType: PaperType;
  bindingType: BindingType;
  interiorInk: InteriorInk;
  marketplace: Marketplace;
}): number {
  const pageCount = Number.isFinite(input.pageCount)
    ? Math.max(0, Math.floor(input.pageCount))
    : 0;

  // v1 baseline per spec: B&W paperback, US marketplace.
  if (input.marketplace !== "us") return NaN;
  if (input.bindingType !== "paperback") return NaN;
  if (input.interiorInk !== "bw") return NaN;
  if (input.paperType === "colour") return NaN;

  const perPage = US_PAPERBACK_BW_PER_PAGE[input.paperType];
  return roundToCents(US_PAPERBACK_BW_FIXED_COST + pageCount * perPage);
}

function roundToCents(n: number) {
  return Math.round(n * 100) / 100;
}

