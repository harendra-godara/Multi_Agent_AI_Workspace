import { useEffect, useState } from "react";
import Topbar from "../components/dashboard/Topbar";
import { api } from "../lib/api";

const agents = [["Research","bg-forest"],["Coding","bg-gold"],["Database","bg-forest-light"],["Testing","bg-emerald-500"],["Review","bg-amber-500"]];

const statusStyle = {
  Completed: "bg-emerald-500/5 text-emerald-600",
  "In review": "bg-amber-500/5 text-amber-600",
  Queued: "bg-black/5 text-stone-600",
  Running: "bg-forest/5 text-forest",
};

function Dashboard() {
  const [task, setTask] = useState("");
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .getTasks()
      .then(setRecent)
      .finally(() => setLoading(false));
  }, []);

  const handleRunTask = async () => {
    if (!task.trim()) return;
    setSubmitting(true);
    try {
      const created = await api.createTask(task.trim());
      setRecent((r) => [created, ...r]);
      setTask("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      <Topbar />
      <main>
        <header className="flex h-[74px] items-center justify-between border-b border-black/10 px-5 sm:px-8">
          <div><p className="text-[10px] uppercase tracking-[0.16em] text-stone-400">Overview</p><h1 className="mt-1 text-lg font-semibold">AI Workspace</h1></div>
          <a href="/workspace" className="rounded-lg bg-gradient-to-r from-forest to-gold px-4 py-2.5 text-xs font-semibold text-white">New task +</a>
        </header>

        <div className="mx-auto max-w-7xl p-5 sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[["Active tasks","03"],["Completed","24"],["Agent runs","87"],["Artifacts","41"]].map(([a,b]) =>
              <div key={a} className="rounded-2xl border border-black/10 bg-white p-5">
                <p className="text-xs text-stone-500">{a}</p><p className="mt-3 text-2xl font-bold">{b}</p><p className="mt-1 text-[10px] text-stone-300">This workspace</p>
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
            <section className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
              <p className="text-xs font-semibold">Start a task</p>
              <p className="mt-1 text-[11px] text-stone-400">Describe what you want the agent team to build.</p>
              <textarea value={task} onChange={e=>setTask(e.target.value)} rows={5} placeholder="Build a REST API with authentication, database integration, and automated tests..." className="mt-5 w-full resize-none rounded-xl border border-black/10 bg-paper p-4 text-sm text-stone-800 outline-none placeholder:text-stone-300 focus:border-forest/40" />
              <div className="mt-4 flex items-center justify-between gap-3"><span className="text-[10px] text-stone-300">Orchestrator will decompose the task.</span><button onClick={handleRunTask} disabled={submitting} className="rounded-lg bg-black/[0.06] px-4 py-2.5 text-xs font-semibold text-stone-800 hover:bg-black/[0.1] disabled:opacity-50">{submitting ? "Running..." : "Run task →"}</button></div>
            </section>

            <section className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
              <p className="text-xs font-semibold">Agent status</p><p className="mt-1 text-[11px] text-stone-400">Core agents available.</p>
              <div className="mt-5 space-y-2">{agents.map(([name,dot]) =>
                <div key={name} className="flex items-center justify-between rounded-xl border border-black/5 bg-black/[0.02] px-3 py-2.5">
                  <div className="flex items-center gap-2.5"><span className={`h-1.5 w-1.5 rounded-full ${dot}`}/><span className="text-xs text-stone-600">{name} Agent</span></div>
                  <span className="text-[10px] text-stone-400">Ready</span>
                </div>
              )}</div>
            </section>
          </div>

          <section className="mt-6 rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
            <div className="flex justify-between"><div><p className="text-xs font-semibold">Recent tasks</p><p className="mt-1 text-[11px] text-stone-400">Latest workspace activity.</p></div><a href="/tasks" className="text-[10px] text-forest">View all</a></div>
            {loading ? (
              <p className="mt-4 text-[11px] text-stone-400">Loading tasks...</p>
            ) : (
              <div className="mt-4 divide-y divide-black/5">{recent.map((t) =>
                <div key={t.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div><p className="text-xs font-medium text-stone-800">{t.title}</p><p className="mt-1 text-[10px] text-stone-300">{t.time}</p></div>
                  <span className={`w-fit rounded-full px-2.5 py-1 text-[9px] ${statusStyle[t.status] || statusStyle.Queued}`}>{t.status}</span>
                </div>
              )}</div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
export default Dashboard;
