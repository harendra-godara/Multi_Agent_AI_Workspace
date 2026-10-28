import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../../assets/logo/agenthub-logo.svg";
import WorkspaceSwitcher from "./WorkspaceSwitcher";

const items = [
  ["Overview", "/dashboard"],
  ["Workspace", "/workspace"],
  ["Tasks", "/tasks"],
  ["Agents", "/agents"],
  ["Members", "/members"],
];

function Topbar() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex h-[70px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <div className="flex items-center gap-8">
          <a href="/" className="flex items-center gap-2.5 shrink-0">
            <img src={logo} alt="AgentHub" className="h-8 w-8 object-contain" />
            <span className="hidden text-base font-bold text-ink sm:block font-display">
              Agent<span className="text-forest">Hub</span>
            </span>
          </a>

          <WorkspaceSwitcher />
        </div>

        <nav className="hidden items-center gap-1 lg:flex">
          {items.map(([name, to]) => (
            <NavLink
              key={name}
              to={to}
              className={({ isActive }) =>
                `rounded-lg px-3.5 py-2 text-xs font-medium transition ${
                  isActive
                    ? "bg-forest/10 text-forest-deep"
                    : "text-stone-500 hover:bg-black/[0.04] hover:text-stone-900"
                }`
              }
            >
              {name}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <NavLink
            to="/settings"
            className="rounded-lg px-3 py-2 text-xs font-medium text-stone-500 hover:bg-black/[0.04] hover:text-stone-900"
          >
            Settings
          </NavLink>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-black/10 px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-black/[0.04]"
          >
            Log out
          </button>
        </div>

        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 lg:hidden"
          aria-label="Toggle menu"
        >
          <span className="text-sm text-stone-700">{menuOpen ? "✕" : "☰"}</span>
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-black/10 px-5 pb-4 pt-2 lg:hidden">
          <nav className="flex flex-col gap-1">
            {items.map(([name, to]) => (
              <NavLink
                key={name}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `rounded-lg px-3.5 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-forest/10 text-forest-deep"
                      : "text-stone-600 hover:bg-black/[0.04]"
                  }`
                }
              >
                {name}
              </NavLink>
            ))}
            <NavLink
              to="/settings"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3.5 py-2.5 text-sm font-medium text-stone-600 hover:bg-black/[0.04]"
            >
              Settings
            </NavLink>
            <button
              onClick={handleLogout}
              className="mt-1 rounded-lg border border-black/10 px-3.5 py-2.5 text-left text-sm font-semibold text-stone-700"
            >
              Log out
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}

export default Topbar;
