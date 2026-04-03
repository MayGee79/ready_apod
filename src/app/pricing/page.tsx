import PricingCalculator from "./ui/PricingCalculator";

export default function PricingPage() {
  return (
    <div className="flex flex-1 justify-center px-6 py-10">
      <main className="w-full max-w-5xl">
        <header className="flex items-end justify-between gap-6">
          <div className="flex flex-col gap-2">
            <p className="text-sm tracking-wide uppercase text-[color:var(--accent)]">
              Phase 1
            </p>
            <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
              Pricing & royalties
            </h1>
          </div>
        </header>

        <div className="mt-8">
          <PricingCalculator />
        </div>
      </main>
    </div>
  );
}

