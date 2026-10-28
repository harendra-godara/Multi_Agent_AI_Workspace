function Hero() {
  const agents = [
    { name: "Research", icon: "⌕" },
    { name: "Coding", icon: "</>" },
    { name: "Database", icon: "DB" },
    { name: "Testing", icon: "✓" },
    { name: "Review", icon: "◈" },
  ];

  return (
    <section className="relative overflow-hidden bg-paper px-5 pb-20 pt-20 sm:px-8 lg:px-10 lg:pb-28 lg:pt-28">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-forest/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 top-40 h-72 w-72 rounded-full bg-gold/10 blur-[100px]" />

      <div className="relative mx-auto max-w-7xl">
        {/* Hero copy */}
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-forest/20 bg-forest/5 px-3.5 py-1.5 text-xs font-medium text-forest-light">
            <span className="h-1.5 w-1.5 rounded-full bg-forest shadow-[0_0_10px_rgba(96,165,250,0.8)]" />
            AI-Powered Software Development Workspace
          </div>

          <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-7xl">
            Turn complex tasks into
            <span className="block bg-gradient-to-r from-forest via-indigo-400 to-gold bg-clip-text text-transparent">
              coordinated AI workflows.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-stone-600 sm:text-lg">
            Give your task to one orchestrator. It breaks the problem into
            subtasks, assigns specialized AI agents, validates their work,
            and brings everything back into one structured result.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="/register"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-forest to-gold px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-forest/15 transition hover:-translate-y-0.5 hover:shadow-forest/25"
            >
              Start a Workspace
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </a>

            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-black/[0.03] px-6 py-3.5 text-sm font-semibold text-stone-800 transition hover:border-black/20 hover:bg-black/[0.06] hover:text-ink"
            >
              See How It Works
            </a>
          </div>
        </div>

        {/* Workflow visual */}
        <div id="how-it-works" className="mx-auto mt-16 max-w-6xl scroll-mt-28">
          <div className="rounded-2xl border border-black/10 bg-black/[0.025] p-4 shadow-2xl shadow-black/20 sm:p-6">
            <div className="mb-5 flex items-center justify-between border-b border-black/10 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest">
                  Live workflow
                </p>
                <p className="mt-1 text-sm text-stone-600">
                  Orchestrator coordinating specialized agents
                </p>
              </div>

              <div className="hidden items-center gap-2 text-xs text-emerald-600 sm:flex">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Ready
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_auto_1.35fr_auto_1fr] lg:items-center">
              {/* User task */}
              <div className="rounded-xl border border-black/10 bg-white p-5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black/5 text-sm">
                    ✦
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">INPUT</p>
                    <p className="text-sm font-semibold text-ink">User Task</p>
                  </div>
                </div>

                <p className="text-sm leading-6 text-stone-600">
                  Build a secure REST API with database integration and tests.
                </p>
              </div>

              <div className="hidden text-2xl text-stone-400 lg:block">→</div>

              {/* Orchestrator */}
              <div className="relative rounded-xl border border-forest/30 bg-gradient-to-br from-forest/10 to-gold/10 p-5 shadow-lg shadow-forest/5">
                <div className="absolute -inset-px -z-10 rounded-xl bg-gradient-to-r from-forest/10 to-gold/10 blur-xl" />

                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-forest to-gold text-lg text-white">
                    ◎
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-forest-light">Core</p>
                    <p className="text-base font-bold text-ink">Orchestrator</p>
                  </div>
                </div>

                <p className="text-sm leading-6 text-stone-600">
                  Plans, decomposes, routes, and coordinates the task.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-md bg-black/5 px-2 py-1 text-[10px] text-stone-600">Plan</span>
                  <span className="rounded-md bg-black/5 px-2 py-1 text-[10px] text-stone-600">Assign</span>
                  <span className="rounded-md bg-black/5 px-2 py-1 text-[10px] text-stone-600">Review</span>
                </div>
              </div>

              <div className="hidden text-2xl text-stone-400 lg:block">→</div>

              {/* Agents */}
              <div className="rounded-xl border border-black/10 bg-white p-5">
                <p className="mb-3 text-xs uppercase tracking-wider text-stone-500">
                  Specialized agents
                </p>

                <div className="grid grid-cols-2 gap-2">
                  {agents.map((agent) => (
                    <div
                      key={agent.name}
                      className="flex items-center gap-2 rounded-lg border border-black/5 bg-black/[0.025] px-2.5 py-2"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-forest/10 text-[9px] font-bold text-forest-light">
                        {agent.icon}
                      </span>
                      <span className="text-[11px] font-medium text-stone-800">
                        {agent.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Result flow */}
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-black/10 bg-white px-4 py-3">
                <p className="text-[10px] uppercase tracking-wider text-stone-500">01</p>
                <p className="mt-1 text-xs font-medium text-stone-800">Agents execute subtasks</p>
              </div>

              <div className="rounded-xl border border-black/10 bg-white px-4 py-3">
                <p className="text-[10px] uppercase tracking-wider text-stone-500">02</p>
                <p className="mt-1 text-xs font-medium text-stone-800">Testing & review validate output</p>
              </div>

              <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.03] px-4 py-3">
                <p className="text-[10px] uppercase tracking-wider text-emerald-600">03</p>
                <p className="mt-1 text-xs font-medium text-emerald-600">Final structured result + artifacts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Agent strip */}
        <div id="agents" className="mx-auto mt-10 max-w-4xl scroll-mt-28">
          <p className="mb-4 text-center text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
            Specialized intelligence
          </p>

          <div className="flex flex-wrap justify-center gap-2">
            {agents.map((agent) => (
              <span
                key={agent.name}
                className="rounded-full border border-black/10 bg-black/[0.025] px-4 py-2 text-xs font-medium text-stone-600"
              >
                {agent.name} Agent
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
