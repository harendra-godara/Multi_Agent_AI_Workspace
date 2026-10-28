const agents = [
  {
    name: "Research Agent",
    role: "Requirements & technical research",
    description:
      "Analyzes the task, gathers relevant technical context, and prepares useful inputs for the workflow.",
    icon: "⌕",
    status: "Ready",
    color: "blue",
    tasks: "12 tasks",
  },
  {
    name: "Coding Agent",
    role: "Software implementation",
    description:
      "Generates implementation-focused solutions from the subtasks assigned by the orchestrator.",
    icon: "</>",
    status: "Ready",
    color: "violet",
    tasks: "18 tasks",
  },
  {
    name: "Database Agent",
    role: "Data & schema design",
    description:
      "Handles database-related subtasks including schema structure, queries, and data integration.",
    icon: "DB",
    status: "Ready",
    color: "cyan",
    tasks: "9 tasks",
  },
  {
    name: "Testing Agent",
    role: "Validation & test generation",
    description:
      "Checks outputs, creates test cases, and helps validate that generated solutions behave correctly.",
    icon: "✓",
    status: "Ready",
    color: "emerald",
    tasks: "15 tasks",
  },
  {
    name: "Review Agent",
    role: "Quality & final review",
    description:
      "Reviews the combined work for consistency, quality, and completeness before the final response.",
    icon: "◈",
    status: "Ready",
    color: "amber",
    tasks: "11 tasks",
  },
];

const colorStyles = {
  blue: {
    icon: "bg-forest/10 text-forest-light ring-forest/10",
    glow: "group-hover:border-forest/30",
    dot: "bg-forest",
  },
  violet: {
    icon: "bg-gold/10 text-gold-light ring-gold/10",
    glow: "group-hover:border-gold/30",
    dot: "bg-gold",
  },
  cyan: {
    icon: "bg-forest-light/10 text-forest-light ring-forest-light/10",
    glow: "group-hover:border-forest-light/30",
    dot: "bg-forest-light",
  },
  emerald: {
    icon: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/10",
    glow: "group-hover:border-emerald-500/30",
    dot: "bg-emerald-500",
  },
  amber: {
    icon: "bg-amber-500/10 text-amber-600 ring-amber-500/10",
    glow: "group-hover:border-amber-500/30",
    dot: "bg-amber-500",
  },
};

function AgentCard({ agent }) {
  const styles = colorStyles[agent.color];

  return (
    <div
      className={`group rounded-2xl border border-black/10 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:bg-stone-50 ${styles.glow}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xs font-bold ring-1 ${styles.icon}`}
        >
          {agent.icon}
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/10 bg-emerald-500/5 px-2.5 py-1">
          <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
          <span className="text-[10px] font-medium text-stone-600">
            {agent.status}
          </span>
        </div>
      </div>

      <div className="mt-5">
        <h3 className="text-base font-semibold text-ink">{agent.name}</h3>
        <p className="mt-1 text-xs font-medium text-stone-500">{agent.role}</p>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          {agent.description}
        </p>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-black/5 pt-4">
        <span className="text-[11px] text-stone-400">{agent.tasks}</span>
        <button
          type="button"
          className="text-xs font-medium text-stone-500 transition hover:text-ink"
        >
          View details →
        </button>
      </div>
    </div>
  );
}

function Agents() {
  return (
    <section
      id="agents"
      className="relative overflow-hidden bg-paper px-5 py-20 sm:px-8 lg:px-10 lg:py-28"
    >
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/5 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-stone-500">
            Specialized agents
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            One workspace.
            <span className="text-stone-500"> Specialized intelligence.</span>
          </h2>

          <p className="mt-4 text-sm leading-6 text-stone-600 sm:text-base">
            Each agent focuses on a specific part of the software-development
            workflow while the orchestrator coordinates the overall task.
          </p>
        </div>

        {/* Agent cards */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <AgentCard key={agent.name} agent={agent} />
          ))}
        </div>

        {/* Activity strip */}
        <div className="mt-5 rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest">
                Agent activity
              </p>
              <p className="mt-1 text-sm text-stone-600">
                A single task can move through multiple specialized agents.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {agents.map((agent, index) => (
                <div key={agent.name} className="flex items-center gap-2">
                  <div className="flex items-center gap-2 rounded-lg border border-black/5 bg-black/[0.025] px-3 py-2">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${colorStyles[agent.color].dot}`}
                    />
                    <span className="text-[11px] text-stone-600">
                      {agent.name.replace(" Agent", "")}
                    </span>
                  </div>

                  {index < agents.length - 1 && (
                    <span className="text-stone-300">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Agents;
