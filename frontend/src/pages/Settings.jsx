import { useNavigate } from "react-router-dom";
import Topbar from "../components/dashboard/Topbar";

function Settings() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      <Topbar />
      <main>
        <header className="flex min-h-[74px] items-center border-b border-black/10 px-5 py-4 sm:px-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-forest">Workspace</p>
            <h1 className="mt-1 text-lg font-semibold">Settings</h1>
          </div>
        </header>

        <div className="mx-auto max-w-2xl p-5 sm:p-8">
          <section className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
            <p className="text-xs font-semibold">Account</p>
            <p className="mt-1 text-[11px] text-stone-400">
              Profile fields, workspace name, and API keys will live here.
            </p>

            <button
              onClick={handleLogout}
              className="mt-6 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-500/10"
            >
              Log out
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Settings;
