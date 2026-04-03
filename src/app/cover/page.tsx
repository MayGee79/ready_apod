import CoverBuilder from "./ui/CoverBuilder";

export default function CoverPage() {
  return (
    <div className="flex flex-1 justify-center px-6 py-10">
      <main className="w-full max-w-5xl">
        <p className="text-sm tracking-wide uppercase text-[color:var(--accent)]">
          Phase 1
        </p>
        <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">
          Cover builder
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-black/70 dark:text-white/70">
          Fabric.js canvas with back/spine/front zones, plus bleed (red) and safe
          guides (blue). Upload an image and position it visually.
        </p>

        <div className="mt-8">
          <CoverBuilder />
        </div>
      </main>
    </div>
  );
}

