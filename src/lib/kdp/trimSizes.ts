export type TrimSize = {
  label: string;
  value: string;
  widthIn: number;
  heightIn: number;
};

export const TRIM_SIZES: TrimSize[] = [
  { label: '5" × 8"', value: "5x8", widthIn: 5, heightIn: 8 },
  { label: '5.06" × 7.81"', value: "5.06x7.81", widthIn: 5.06, heightIn: 7.81 },
  { label: '5.5" × 8.5"', value: "5.5x8.5", widthIn: 5.5, heightIn: 8.5 },
  { label: '6" × 9"', value: "6x9", widthIn: 6, heightIn: 9 },
  { label: '6.14" × 9.21"', value: "6.14x9.21", widthIn: 6.14, heightIn: 9.21 },
  { label: '6.69" × 9.61"', value: "6.69x9.61", widthIn: 6.69, heightIn: 9.61 },
  { label: '7" × 10"', value: "7x10", widthIn: 7, heightIn: 10 },
  { label: '7.44" × 9.69"', value: "7.44x9.69", widthIn: 7.44, heightIn: 9.69 },
  { label: '7.5" × 9.25"', value: "7.5x9.25", widthIn: 7.5, heightIn: 9.25 },
  { label: '8" × 10"', value: "8x10", widthIn: 8, heightIn: 10 },
  { label: '8.5" × 11"', value: "8.5x11", widthIn: 8.5, heightIn: 11 },
];

