import InteriorValidator from "./ui/InteriorValidator";

export default function InteriorPage() {
  return (
    <div className="flex flex-1 justify-center px-6 py-10">
      <main className="w-full max-w-5xl">
        <p className="text-sm tracking-wide uppercase text-[color:var(--accent)]">
          Phase 1
        </p>
        <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">
          Interior validator
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-black/70 dark:text-white/70">
          Upload your interior PDF and run client-side checks (page size, page count,
          font embedding, and image resolution).
        </p>

        <div className="mt-8">
          <InteriorValidator />
        </div>
      </main>
    </div>
  );
}

