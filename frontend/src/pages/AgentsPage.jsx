import { useEffect, useState } from "react";
import Topbar from "../components/dashboard/Topbar";
import { api } from "../lib/api";

function AgentsPage() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getAgents()
      .then(setAgents)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <Topbar />
      <main>
        <header className="flex min-h-[74px] items-center border-b border-black/10 px-5 py-4 sm:px-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-forest">Workspace</p>
            <h1 className="mt-1 text-lg font-semibold">Agents</h1>
          </div>
        </header>

        <div className="mx-auto max-w-5xl p-5 sm:p-8">
          {loading ? (
            <p className="text-xs text-stone-400">Loading agents...</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {agents.map((agent) => (
                <div
                  key={agent.name}
                  className="rounded-2xl border border-black/10 bg-white p-5"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-stone-900">{agent.name}</p>
                    <span className="rounded-full bg-emerald-500/5 px-2.5 py-1 text-[9px] text-emerald-600">
                      {agent.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-stone-400">{agent.role}</p>
                  <p className="mt-4 text-[10px] text-stone-300">{agent.tasks}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AgentsPage;
