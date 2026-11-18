function WorkspacePreview() {
  const agents = [
    {
      name: "Research",
      task: "Analyzing requirements",
      status: "Completed",
      icon: "⌕",
      progress: "100%",
      dot: "bg-emerald-500",
    },
    {
      name: "Coding",
      task: "Building API structure",
      status: "Running",
      icon: "</>",
      progress: "68%",
      dot: "bg-forest",
    },
    {
      name: "Database",
      task: "Designing schema",
      status: "Running",
      icon: "DB",
      progress: "42%",
      dot: "bg-gold",
    },
    {
      name: "Testing",
      task: "Waiting for dependencies",
      status: "Queued",
      icon: "✓",
      progress: "0%",
      dot: "bg-stone-300",
    },
  ];

  return (
    <section
      id="product"
      className="relative overflow-hidden bg-paper px-5 py-20 sm:px-8 lg:px-10 lg:py-28"
    >
      <div className="pointer-events-none absolute right-0 top-1/3 h-96 w-96 rounded-full bg-forest/5 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl">
        {/* Heading */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-stone-500">
            AI workspace
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Watch your task become a
            <span className="text-stone-500"> coordinated workflow.</span>
          </h2>

          <p className="mt-4 text-sm leading-6 text-stone-600 sm:text-base">
            The workspace keeps the task, agent execution, logs, and final
            output together in one place.
          </p>
        </div>

        {/* Workspace shell */}
        <div className="mt-12 overflow-hidden rounded-2xl border border-black/10 bg-paper-deep shadow-2xl shadow-black/30">
          {/* Window header */}
          <div className="flex h-12 items-center justify-between border-b border-black/10 bg-stone-50 px-4 sm:px-5">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
            </div>

            <div className="hidden rounded-md border border-black/5 bg-black/[0.025] px-4 py-1 text-[10px] text-stone-500 sm:block">
              workspace / api-security-task
            </div>

            <span className="text-[10px] text-stone-400">LIVE</span>
          </div>

          <div className="grid lg:grid-cols-[220px_1fr_300px]">
            {/* Sidebar */}
            <aside className="hidden border-r border-black/10 bg-white p-4 lg:block">
              <p className="mb-3 px-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-stone-400">
                Workspace
              </p>

              <div className="space-y-1">
                <div className="rounded-lg bg-forest/10 px-3 py-2.5 text-xs font-medium text-forest-light">
                  Current Task
                </div>
                <div className="rounded-lg px-3 py-2.5 text-xs text-stone-500">
                  Agent Runs
                </div>
                <div className="rounded-lg px-3 py-2.5 text-xs text-stone-500">
                  Artifacts
                </div>
                <div className="rounded-lg px-3 py-2.5 text-xs text-stone-500">
                  Reviews
                </div>
              </div>

              <div className="mt-8 border-t border-black/5 pt-5">
                <p className="mb-3 px-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-stone-400">
                  Orchestrator
                </p>

                <div className="rounded-lg border border-forest/15 bg-forest/5 p-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-forest to-gold text-xs text-white">
                      ◎
                    </span>
                    <div>
                      <p className="text-[11px] font-semibold text-ink">
                        Planning
                      </p>
                      <p className="text-[9px] text-stone-500">
                        Coordinating agents
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main workspace */}
            <main className="min-w-0 border-b border-black/10 lg:border-b-0 lg:border-r">
              <div className="border-b border-black/10 p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-forest">
                      Current task
                    </p>
                    <h3 className="mt-2 text-base font-semibold text-ink sm:text-lg">
                      Build a secure REST API with database integration
                    </h3>
                  </div>

                  <span className="shrink-0 rounded-full border border-forest/20 bg-forest/5 px-2.5 py-1 text-[10px] text-forest-light">
                    In progress
                  </span>
                </div>

                <p className="mt-3 max-w-2xl text-xs leading-5 text-stone-500">
                  Create the API structure, connect the database, add
                  authentication, and validate the implementation with tests.
                </p>
              </div>

              {/* Agent execution */}
              <div className="p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs font-semibold text-stone-800">
                    Agent execution
                  </p>
                  <p className="text-[10px] text-stone-400">2 running · 1 done</p>
                </div>

                <div className="space-y-3">
                  {agents.map((agent) => (
                    <div
                      key={agent.name}
                      className="rounded-xl border border-black/5 bg-black/[0.02] p-3.5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/5 text-[9px] font-bold text-stone-800">
                          {agent.icon}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs font-medium text-stone-800">
                              {agent.name} Agent
                            </p>
                            <span className="text-[10px] text-stone-400">
                              {agent.progress}
                            </span>
                          </div>

                          <div className="mt-1 flex items-center gap-1.5">
                            <span className={`h-1.5 w-1.5 rounded-full ${agent.dot}`} />
                            <span className="truncate text-[10px] text-stone-500">
                              {agent.task}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 h-1 overflow-hidden rounded-full bg-black/5">
                        <div
                          className={`h-full rounded-full ${
                            agent.status === "Completed"
                              ? "w-full bg-emerald-500/60"
                              : agent.status === "Running" && agent.name === "Coding"
                              ? "w-[68%] bg-forest/60"
                              : agent.status === "Running"
                              ? "w-[42%] bg-gold/60"
                              : "w-0"
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Logs */}
                <div className="mt-5 rounded-xl border border-black/5 bg-stone-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                      Execution logs
                    </p>
                    <span className="text-[9px] text-emerald-600">streaming</span>
                  </div>

                  <div className="space-y-2 font-mono text-[9px] leading-4">
                    <p>
                      <span className="text-stone-300">22:41:03</span>{" "}
                      <span className="text-forest">[orchestrator]</span>{" "}
                      <span className="text-stone-500">
                        Subtasks assigned successfully
                      </span>
                    </p>
                    <p>
                      <span className="text-stone-300">22:41:09</span>{" "}
                      <span className="text-gold">[coding]</span>{" "}
                      <span className="text-stone-500">
                        Generating API structure...
                      </span>
                    </p>
                    <p>
                      <span className="text-stone-300">22:41:14</span>{" "}
                      <span className="text-forest-light">[database]</span>{" "}
                      <span className="text-stone-500">
                        Preparing schema...
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </main>

            {/* Result panel */}
            <aside className="bg-white p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-stone-800">
                  Result
                </p>
                <span className="rounded-md bg-black/5 px-2 py-1 text-[9px] text-stone-500">
                  Preview
                </span>
              </div>

              <div className="mt-4 rounded-xl border border-black/5 bg-paper p-4">
                <p className="text-[10px] uppercase tracking-[0.14em] text-stone-400">
                  Generated artifacts
                </p>

                <div className="mt-3 space-y-2">
                  {["server.js", "routes/api.js", "database/schema.sql"].map(
                    (file) => (
                      <div
                        key={file}
                        className="flex items-center justify-between rounded-lg border border-black/5 bg-black/[0.02] px-3 py-2"
                      >
                        <span className="text-[10px] text-stone-600">{file}</span>
                        <span className="text-[9px] text-emerald-600">ready</span>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.03] p-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/10 text-xs text-emerald-600">
                    ✓
                  </span>
                  <p className="text-[11px] font-medium text-emerald-600">
                    Review pipeline
                  </p>
                </div>

                <p className="mt-2 text-[10px] leading-4 text-stone-500">
                  Testing and review will validate the combined output before
                  the final response is returned.
                </p>
              </div>

              <button
                type="button"
                className="mt-4 w-full rounded-lg border border-black/10 bg-black/[0.03] px-3 py-2.5 text-[10px] font-semibold text-stone-600 transition hover:bg-black/[0.06] hover:text-ink"
              >
                Open full workspace →
              </button>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}

export default WorkspacePreview;
