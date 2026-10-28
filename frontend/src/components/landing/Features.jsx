const features = [
  {
    number: "01",
    title: "Orchestrated workflows",
    description:
      "Break a complex software task into focused subtasks and coordinate the right agents through one workflow.",
    icon: "◎",
    accent: "blue",
  },
  {
    number: "02",
    title: "Specialized AI agents",
    description:
      "Use dedicated Research, Coding, Database, Testing, and Review agents instead of relying on one general response.",
    icon: "◈",
    accent: "violet",
  },
  {
    number: "03",
    title: "Parallel execution",
    description:
      "Independent subtasks can be handled by specialized agents while the orchestrator keeps the overall workflow organized.",
    icon: "⇄",
    accent: "cyan",
  },
  {
    number: "04",
    title: "Testing & review",
    description:
      "Generated work passes through validation and review so the final response is based on a checked workflow.",
    icon: "✓",
    accent: "emerald",
  },
  {
    number: "05",
    title: "Execution logs",
    description:
      "Follow what the orchestrator and agents are doing with a clear activity and execution trail inside the workspace.",
    icon: "≡",
    accent: "amber",
  },
  {
    number: "06",
    title: "Artifacts in one place",
    description:
      "Keep generated code, schemas, test outputs, and other workflow artifacts connected to the task.",
    icon: "▣",
    accent: "pink",
  },
];

const accentStyles = {
  blue: {
    icon: "bg-forest/10 text-forest-light",
    line: "from-forest/40",
  },
  violet: {
    icon: "bg-gold/10 text-gold-light",
    line: "from-gold/40",
  },
  cyan: {
    icon: "bg-forest-light/10 text-forest-light",
    line: "from-forest-light/40",
  },
  emerald: {
    icon: "bg-emerald-500/10 text-emerald-600",
    line: "from-emerald-400/40",
  },
  amber: {
    icon: "bg-amber-500/10 text-amber-600",
    line: "from-amber-400/40",
  },
  pink: {
    icon: "bg-gold-light/10 text-gold-light",
    line: "from-gold/40",
  },
};

function FeatureCard({ feature }) {
  const styles = accentStyles[feature.accent];

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-black/10 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-black/15 hover:bg-stone-50 sm:p-6">
      <div
        className={`absolute left-0 top-0 h-px w-24 bg-gradient-to-r ${styles.line} to-transparent opacity-0 transition group-hover:opacity-100`}
      />

      <div className="flex items-start justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold ${styles.icon}`}
        >
          {feature.icon}
        </div>

        <span className="text-[10px] font-medium tracking-widest text-stone-300">
          {feature.number}
        </span>
      </div>

      <h3 className="mt-6 text-base font-semibold text-ink">
        {feature.title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-stone-500">
        {feature.description}
      </p>
    </div>
  );
}

function Features() {
  return (
    <section
      id="features"
      className="relative overflow-hidden bg-paper px-5 py-20 sm:px-8 lg:px-10 lg:py-28"
    >
      <div className="pointer-events-none absolute left-1/4 top-1/3 h-80 w-80 rounded-full bg-forest/5 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          {/* Intro */}
          <div className="max-w-xl">
            <div className="mb-4 inline-flex rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-stone-500">
              Built for coordinated execution
            </div>

            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Everything you need to
              <span className="block text-stone-500">
                run an AI development workflow.
              </span>
            </h2>

            <p className="mt-5 text-sm leading-7 text-stone-600 sm:text-base">
              From task decomposition to agent execution, testing, review, and
              artifacts, the workspace keeps the complete workflow visible and
              organized.
            </p>
          </div>

          {/* Workflow summary */}
          <div className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-stone-800">
                Workflow pipeline
              </p>
              <span className="text-[10px] text-stone-400">
                Orchestrator controlled
              </span>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              {[
                "Task",
                "Plan",
                "Agents",
                "Testing",
                "Review",
                "Result",
              ].map((step, index, arr) => (
                <div key={step} className="flex items-center gap-2">
                  <span
                    className={`rounded-lg border px-3 py-2 text-[10px] font-medium ${
                      index === 0
                        ? "border-forest/20 bg-forest/5 text-forest-light"
                        : index === arr.length - 1
                        ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-600"
                        : "border-black/5 bg-black/[0.02] text-stone-500"
                    }`}
                  >
                    {step}
                  </span>

                  {index < arr.length - 1 && (
                    <span className="text-stone-300">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feature grid */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={feature.number} feature={feature} />
          ))}
        </div>

        {/* Bottom callout */}
        <div className="mt-5 rounded-2xl border border-forest/10 bg-gradient-to-r from-forest/[0.06] via-gold/[0.04] to-transparent p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">
                One task. Multiple specialists. One structured result.
              </p>
              <p className="mt-1 text-xs text-stone-500">
                The orchestrator keeps every stage connected.
              </p>
            </div>

            <a
              href="/register"
              className="inline-flex w-fit items-center gap-2 rounded-lg border border-black/10 bg-black/[0.04] px-4 py-2.5 text-xs font-semibold text-stone-800 transition hover:bg-black/[0.08] hover:text-ink"
            >
              Start building
              <span>→</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Features;
