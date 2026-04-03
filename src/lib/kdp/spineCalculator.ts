export type PaperType = "white" | "cream" | "colour";
export type BindingType = "paperback" | "hardcover";

const PAPER_THICKNESS_IN_PER_PAGE: Record<PaperType, number> = {
  white: 0.002252,
  cream: 0.0025,
  colour: 0.002347,
};

const MIN_SPINE_WITH_TEXT_IN = 0.0625;

export function calculateSpineWidthInches(input: {
  pageCount: number;
  paperType: PaperType;
  bindingType: BindingType;
}): number {
  const pageCount = Number.isFinite(input.pageCount)
    ? Math.max(0, Math.floor(input.pageCount))
    : 0;

  // v1: hardcover differs; we surface paperback math and keep UI disabled
  if (input.bindingType === "hardcover") {
    return Math.max(MIN_SPINE_WITH_TEXT_IN, pageCount * PAPER_THICKNESS_IN_PER_PAGE[input.paperType]);
  }

  const spine = pageCount * PAPER_THICKNESS_IN_PER_PAGE[input.paperType];
  return Math.max(MIN_SPINE_WITH_TEXT_IN, spine);
}

