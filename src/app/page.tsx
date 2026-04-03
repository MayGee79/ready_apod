import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 justify-center px-6 py-12 sm:py-16">
      <main className="w-full max-w-5xl">
        <header className="flex flex-col gap-3">
          <p className="text-sm tracking-wide uppercase text-[color:var(--accent)]">
            Self-publishing toolkit
          </p>
          <h1 className="font-display text-4xl leading-tight tracking-tight sm:text-5xl">
            KDP Companion
          </h1>
          <p className="max-w-2xl text-base leading-7 text-black/70 dark:text-white/70">
            Enter your book specs once, then run pricing & royalty math, cover
            dimension checks, and interior PDF validation as a connected project.
          </p>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <ToolCard
            href="/pricing"
            title="Pricing & royalties"
            description="Spine width, print cost, break-even, and royalty at any list price."
          />
          <ToolCard
            href="/cover"
            title="Cover builder"
            description="Imposition guides with bleed + safe zones. Export-ready cover PDFs."
          />
          <ToolCard
            href="/interior"
            title="Interior validator"
            description="Client-side PDF checks that read like editor’s notes, not error spam."
          />
        </section>

        <footer className="mt-12 text-sm text-black/60 dark:text-white/60">
          Phase 1 ships as stateless tools (no login).
        </footer>
      </main>
    </div>
  );
}

function ToolCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[0_10px_30px_rgba(28,28,46,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_40px_rgba(28,28,46,0.10)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
    >
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-xl tracking-tight">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-black/70 dark:text-white/70">
          {description}
        </p>
        <div className="mt-2 text-sm font-medium text-[color:var(--accent)]">
          Open →
        </div>
      </div>
    </Link>
  );
}
