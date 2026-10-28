import { useEffect, useState } from "react";
import Topbar from "../components/dashboard/Topbar";
import { api } from "../lib/api";
import { getCurrentWorkspaceId } from "../lib/workspace";

const statusStyle = {
  Active: "bg-emerald-500/5 text-emerald-600",
  Pending: "bg-amber-500/5 text-amber-600",
};

function Members() {
  const workspaceId = getCurrentWorkspaceId() || "ws-1";
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ email: "", role: "Member" });
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    api
      .getMembers(workspaceId)
      .then(setMembers)
      .finally(() => setLoading(false));
  }, [workspaceId]);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!form.email.trim()) return;
    setSending(true);
    setNotice("");
    try {
      const invite = await api.inviteMember(workspaceId, form);
      setMembers((m) => [...m, invite]);
      setNotice(`Invite sent to ${form.email}`);
      setForm({ email: "", role: "Member" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      <Topbar />
      <main>
        <header className="flex min-h-[74px] items-center border-b border-black/10 px-5 py-4 sm:px-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-forest">Workspace</p>
            <h1 className="mt-1 text-lg font-semibold">Members</h1>
          </div>
        </header>

        <div className="mx-auto max-w-3xl p-5 sm:p-8">
          <form
            onSubmit={handleInvite}
            className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6"
          >
            <p className="text-xs font-semibold">Invite a teammate</p>
            <p className="mt-1 text-[11px] text-stone-400">
              They'll get access to this workspace's tasks, agents, and logs.
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="teammate@example.com"
                className="flex-1 rounded-xl border border-black/10 bg-paper px-4 py-2.5 text-sm text-ink outline-none placeholder:text-stone-300 focus:border-forest/40"
              />
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="rounded-xl border border-black/10 bg-paper px-3 py-2.5 text-sm text-stone-800 outline-none focus:border-forest/40"
              >
                <option value="Member">Member</option>
                <option value="Admin">Admin</option>
              </select>
              <button
                type="submit"
                disabled={sending}
                className="rounded-lg bg-gradient-to-r from-forest to-gold px-5 py-2.5 text-xs font-semibold disabled:opacity-50 text-white"
              >
                {sending ? "Sending..." : "Send invite"}
              </button>
            </div>

            {notice && <p className="mt-3 text-xs text-emerald-600">{notice}</p>}
          </form>

          <section className="mt-6 rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold">Team</p>
              <span className="text-[10px] text-stone-400">
                {members.length} member{members.length === 1 ? "" : "s"}
              </span>
            </div>

            {loading ? (
              <p className="mt-4 text-xs text-stone-400">Loading members...</p>
            ) : (
              <div className="mt-4 divide-y divide-black/5">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-3 py-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-forest to-gold text-xs font-bold text-white">
                        {m.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-stone-900">{m.name}</p>
                        <p className="text-[10px] text-stone-400">{m.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-stone-400">{m.role}</span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[9px] ${
                          statusStyle[m.status] || statusStyle.Pending
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>
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

export default Members;
