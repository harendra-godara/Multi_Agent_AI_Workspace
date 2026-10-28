import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Topbar from "../components/dashboard/Topbar";
import { api } from "../lib/api";
import { setCurrentWorkspaceId } from "../lib/workspace";

function Workspaces() {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api
      .getWorkspaces()
      .then(setWorkspaces)
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      const workspace = await api.createWorkspace(form);
      setWorkspaces((w) => [workspace, ...w]);
      setForm({ name: "", description: "" });
      setShowForm(false);
      setCurrentWorkspaceId(workspace.id);
      navigate("/dashboard");
    } finally {
      setCreating(false);
    }
  };

  const handleOpen = (workspace) => {
    setCurrentWorkspaceId(workspace.id);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      <Topbar />
      <main>
        <header className="flex min-h-[74px] items-center justify-between border-b border-black/10 px-5 py-4 sm:px-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-forest">Account</p>
            <h1 className="mt-1 text-lg font-semibold">Workspaces</h1>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-lg bg-gradient-to-r from-forest to-gold px-4 py-2.5 text-xs font-semibold text-white"
          >
            {showForm ? "Cancel" : "New workspace +"}
          </button>
        </header>

        <div className="mx-auto max-w-5xl p-5 sm:p-8">
          {showForm && (
            <form
              onSubmit={handleCreate}
              className="mb-6 rounded-2xl border border-black/10 bg-white p-5 sm:p-6"
            >
              <p className="text-xs font-semibold">Create a workspace</p>
              <p className="mt-1 text-[11px] text-stone-400">
                Each workspace keeps its own tasks, agent runs, and team members.
              </p>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium text-stone-600">
                    Name
                  </label>
                  <input
                    name="name"
                    required
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. E-commerce Backend"
                    className="w-full rounded-xl border border-black/10 bg-paper px-4 py-2.5 text-sm text-ink outline-none placeholder:text-stone-300 focus:border-forest/40"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium text-stone-600">
                    Description (optional)
                  </label>
                  <input
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="What's this workspace for?"
                    className="w-full rounded-xl border border-black/10 bg-paper px-4 py-2.5 text-sm text-ink outline-none placeholder:text-stone-300 focus:border-forest/40"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="mt-5 rounded-lg bg-gradient-to-r from-forest to-gold px-4 py-2.5 text-xs font-semibold disabled:opacity-50 text-white"
              >
                {creating ? "Creating..." : "Create workspace"}
              </button>
            </form>
          )}

          {loading ? (
            <p className="text-xs text-stone-400">Loading workspaces...</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => handleOpen(ws)}
                  className="rounded-2xl border border-black/10 bg-white p-5 text-left transition hover:border-forest/30 hover:bg-stone-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-forest/20 to-gold/20 text-sm font-bold text-forest-light">
                      {ws.name.slice(0, 1).toUpperCase()}
                    </div>
                    <span className="rounded-full bg-black/5 px-2.5 py-1 text-[9px] text-stone-500">
                      {ws.role}
                    </span>
                  </div>
                  <p className="mt-4 text-sm font-semibold text-stone-950">{ws.name}</p>
                  <p className="mt-1 text-[11px] text-stone-400">
                    {ws.description || "No description"}
                  </p>
                  <p className="mt-4 text-[10px] text-stone-300">
                    {ws.members} member{ws.members === 1 ? "" : "s"}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Workspaces;
