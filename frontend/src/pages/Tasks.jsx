import { useEffect, useState } from "react";
import Topbar from "../components/dashboard/Topbar";
import { api } from "../lib/api";

const statusStyle = {
  Completed: "bg-emerald-500/5 text-emerald-600",
  "In review": "bg-amber-500/5 text-amber-600",
  Queued: "bg-black/5 text-stone-600",
  Running: "bg-forest/5 text-forest",
};

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getTasks()
      .then(setTasks)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <Topbar />
      <main>
        <header className="flex min-h-[74px] items-center justify-between border-b border-black/10 px-5 py-4 sm:px-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-forest">Workspace</p>
            <h1 className="mt-1 text-lg font-semibold">All tasks</h1>
          </div>
          <a
            href="/workspace"
            className="rounded-lg bg-gradient-to-r from-forest to-gold px-4 py-2.5 text-xs font-semibold text-white"
          >
            New task +
          </a>
        </header>

        <div className="mx-auto max-w-5xl p-5 sm:p-8">
          <section className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
            <div className="flex justify-between">
              <div>
                <p className="text-xs font-semibold">Task history</p>
                <p className="mt-1 text-[11px] text-stone-400">Every task run through the orchestrator.</p>
              </div>
              <span className="text-[10px] text-stone-400">{tasks.length} total</span>
            </div>

            {loading ? (
              <p className="mt-6 text-xs text-stone-400">Loading tasks...</p>
            ) : tasks.length === 0 ? (
              <p className="mt-6 text-xs text-stone-400">No tasks yet — run your first one.</p>
            ) : (
              <div className="mt-4 divide-y divide-black/5">
                {tasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-xs font-medium text-stone-800">{t.title}</p>
                      <p className="mt-1 text-[10px] text-stone-300">{t.time}</p>
                    </div>
                    <span
                      className={`w-fit rounded-full px-2.5 py-1 text-[9px] ${
                        statusStyle[t.status] || statusStyle.Queued
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default Tasks;
