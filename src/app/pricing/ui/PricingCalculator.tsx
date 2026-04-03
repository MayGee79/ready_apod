"use client";

import { useMemo, useState } from "react";
import { TRIM_SIZES } from "@/lib/kdp/trimSizes";
import { calculateSpineWidthInches } from "@/lib/kdp/spineCalculator";
import {
  calculatePrintingCostUSD,
  type Marketplace,
} from "@/lib/kdp/printingCosts";
import { calculateRoyaltyUSD } from "@/lib/kdp/royaltyCalculator";
import { formatCurrencyUSD } from "@/lib/utils/formatting";

type PaperType = "white" | "cream" | "colour";
type BindingType = "paperback" | "hardcover";

export default function PricingCalculator() {
  const [trimSize, setTrimSize] = useState(TRIM_SIZES[3]?.value ?? "6x9");
  const [pageCount, setPageCount] = useState<number>(300);
  const [paperType, setPaperType] = useState<PaperType>("white");
  const [bindingType, setBindingType] = useState<BindingType>("paperback");
  const [marketplace, setMarketplace] = useState<Marketplace>("us");
  const [listPrice, setListPrice] = useState<number>(9.99);

  const slider = useMemo(() => {
    // v1: keep it simple; widen range a bit so users can explore beyond 70% band.
    const min = 0;
    const max = 24.99;
    const step = 0.01;
    return { min, max, step };
  }, []);

  const spineWidthIn = useMemo(() => {
    return calculateSpineWidthInches({ pageCount, paperType, bindingType });
  }, [pageCount, paperType, bindingType]);

  const printingCost = useMemo(() => {
    return calculatePrintingCostUSD({
      pageCount,
      paperType,
      bindingType,
      marketplace,
      interiorInk: "bw",
    });
  }, [pageCount, paperType, bindingType, marketplace]);

  const royalty = useMemo(() => {
    return calculateRoyaltyUSD({ listPriceUSD: listPrice, printingCostUSD: printingCost });
  }, [listPrice, printingCost]);

  const trim = TRIM_SIZES.find((t) => t.value === trimSize);

  return (
    <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
      <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5">
        <div className="grid gap-4">
          <Field id="trimSize" label="Trim size">
            <select
              id="trimSize"
              aria-label="Trim size"
              title="Trim size"
              className="h-10 w-full rounded-xl border border-[color:var(--border)] bg-white/70 px-3 text-sm dark:bg-black/30"
              value={trimSize}
              onChange={(e) => setTrimSize(e.target.value)}
            >
              {TRIM_SIZES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field id="pageCount" label="Pages">
              <input
                id="pageCount"
                aria-label="Pages"
                title="Pages"
                className="h-10 w-full rounded-xl border border-[color:var(--border)] bg-white/70 px-3 text-sm dark:bg-black/30"
                type="number"
                min={1}
                value={Number.isFinite(pageCount) ? pageCount : 0}
                onChange={(e) => setPageCount(Math.max(1, Number(e.target.value)))}
              />
            </Field>
            <Field id="listPrice" label="List price (USD)">
              <input
                id="listPrice"
                aria-label="List price (USD)"
                title="List price (USD)"
                className="h-10 w-full rounded-xl border border-[color:var(--border)] bg-white/70 px-3 text-sm dark:bg-black/30"
                type="number"
                min={0}
                step={0.01}
                value={Number.isFinite(listPrice) ? listPrice : 0}
                onChange={(e) => setListPrice(Math.max(0, Number(e.target.value)))}
              />
            </Field>
          </div>

          <div className="rounded-2xl border border-[color:var(--border)] bg-white/60 p-4 dark:bg-black/20">
            <div className="flex items-baseline justify-between gap-3">
              <div className="text-xs font-medium text-black/70 dark:text-white/70">
                Royalty slider
              </div>
              <div className="font-display text-lg tracking-tight">
                {formatCurrencyUSD(listPrice)}
              </div>
            </div>
            <input
              id="listPriceSlider"
              aria-label="List price slider (USD)"
              title="List price slider (USD)"
              className="mt-3 w-full accent-[color:var(--accent)]"
              type="range"
              min={slider.min}
              max={slider.max}
              step={slider.step}
              value={Number.isFinite(listPrice) ? listPrice : 0}
              onChange={(e) => setListPrice(Number(e.target.value))}
            />
            <div className="mt-2 flex justify-between text-[11px] text-black/55 dark:text-white/55">
              <span>{formatCurrencyUSD(slider.min)}</span>
              <span>{formatCurrencyUSD(slider.max)}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {([2.99, 3.99, 4.99, 7.99, 9.99, 12.99] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setListPrice(p)}
                  className="rounded-full border border-[color:var(--border)] bg-white/70 px-3 py-1 transition hover:bg-white dark:bg-black/20 dark:hover:bg-black/30"
                >
                  {formatCurrencyUSD(p)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field id="paperType" label="Paper">
              <select
                id="paperType"
                aria-label="Paper type"
                title="Paper type"
                className="h-10 w-full rounded-xl border border-[color:var(--border)] bg-white/70 px-3 text-sm dark:bg-black/30"
                value={paperType}
                onChange={(e) => setPaperType(e.target.value as PaperType)}
              >
                <option value="white">White</option>
                <option value="cream">Cream</option>
                <option value="colour">Colour</option>
              </select>
            </Field>
            <Field id="bindingType" label="Binding">
              <select
                id="bindingType"
                aria-label="Binding type"
                title="Binding type"
                className="h-10 w-full rounded-xl border border-[color:var(--border)] bg-white/70 px-3 text-sm dark:bg-black/30"
                value={bindingType}
                onChange={(e) => setBindingType(e.target.value as BindingType)}
              >
                <option value="paperback">Paperback</option>
                <option value="hardcover" disabled>
                  Hardcover (v1.1)
                </option>
              </select>
            </Field>
          </div>

          <Field id="marketplace" label="Marketplace">
            <select
              id="marketplace"
              aria-label="Marketplace"
              title="Marketplace"
              className="h-10 w-full rounded-xl border border-[color:var(--border)] bg-white/70 px-3 text-sm dark:bg-black/30"
              value={marketplace}
              onChange={(e) => setMarketplace(e.target.value as Marketplace)}
            >
              <option value="us">US</option>
            </select>
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5">
        <div className="flex flex-col gap-5">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-display text-2xl tracking-tight">Live results</h2>
            <div className="text-sm text-black/60 dark:text-white/60">
              {trim ? `${trim.widthIn}" × ${trim.heightIn}"` : trimSize}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Spine width" value={`${spineWidthIn.toFixed(4)} in`} />
            <Stat label="Printing cost" value={formatCurrencyUSD(printingCost)} />
            <Stat label="Royalty (est.)" value={formatCurrencyUSD(royalty.royaltyUSD)} />
          </div>

          <div className="rounded-xl border border-[color:var(--border)] bg-white/60 p-4 text-sm leading-6 dark:bg-black/20">
            <div className="flex justify-between gap-3">
              <span>Royalty rate</span>
              <span className="font-medium">{royalty.rateLabel}</span>
            </div>
            {royalty.rateLabel === "70%" && (
              <div className="flex justify-between gap-3">
                <span>Calculation</span>
                <span className="font-medium">
                  {formatCurrencyUSD(listPrice)} × 0.70 − {formatCurrencyUSD(printingCost)}
                </span>
              </div>
            )}
            {royalty.breakEvenPriceUSD != null && (
              <div className="flex justify-between gap-3">
                <span>Break-even (70%)</span>
                <span className="font-medium">
                  {formatCurrencyUSD(royalty.breakEvenPriceUSD)}
                </span>
              </div>
            )}
          </div>

          <p className="text-xs leading-5 text-black/60 dark:text-white/60">
            Notes: Printing rates here are a v1 baseline (B&amp;W paperback US). KDP rates change; we’ll
            make marketplace/rate tables configurable before launch.
          </p>
        </div>
      </section>
    </div>
  );
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={id} className="grid gap-1">
      <span className="text-xs font-medium text-black/70 dark:text-white/70">{label}</span>
      {children}
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-white/60 p-4 dark:bg-black/20">
      <div className="text-xs font-medium text-black/60 dark:text-white/60">{label}</div>
      <div className="mt-1 font-display text-xl tracking-tight">{value}</div>
    </div>
  );
}

