function CTA() {
  return (
    <section className="relative overflow-hidden bg-paper px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-forest/15 bg-gradient-to-br from-forest/[0.10] via-gold/[0.07] to-transparent px-6 py-14 text-center shadow-2xl shadow-forest-deep/20 sm:px-10 lg:px-16">
        <div className="pointer-events-none absolute left-1/2 top-0 h-56 w-96 -translate-x-1/2 rounded-full bg-forest/10 blur-[100px]" />

        <div className="relative">
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/[0.04] px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-stone-500">
            Build with coordinated AI
          </div>

          <h2 className="font-display mx-auto max-w-3xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Give your next complex task
            <span className="block bg-gradient-to-r from-forest-light to-gold bg-clip-text text-transparent">
              a team of AI agents.
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-stone-600 sm:text-base">
            Start with one task and let the orchestrator coordinate research,
            implementation, database work, testing, and review.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="/register"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-forest to-gold px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-forest/15 transition hover:-translate-y-0.5"
            >
              Create a workspace
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </a>

            <a
              href="/login"
              className="rounded-xl border border-black/10 bg-black/[0.03] px-6 py-3.5 text-sm font-semibold text-stone-800 transition hover:bg-black/[0.07] hover:text-ink"
            >
              Sign in
            </a>
          </div>

          <p className="mt-5 text-[10px] text-stone-400">
            No complex setup for the first workflow.
          </p>
        </div>
      </div>
    </section>
  );
}

export default CTA;
