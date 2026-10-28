import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { getCurrentWorkspaceId, setCurrentWorkspaceId } from "../../lib/workspace";

function WorkspaceSwitcher() {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [current, setCurrent] = useState(null);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    api.getWorkspaces().then((list) => {
      setWorkspaces(list);
      const savedId = getCurrentWorkspaceId();
      const found = list.find((w) => w.id === savedId) || list[0];
      if (found) {
        setCurrent(found);
        setCurrentWorkspaceId(found.id);
      }
    });
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleSelect = (ws) => {
    setCurrent(ws);
    setCurrentWorkspaceId(ws.id);
    setOpen(false);
    navigate("/dashboard");
  };

  if (!current) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-black/10 bg-black/[0.03] py-2 pl-2 pr-3 text-left transition hover:bg-black/[0.06]"
      >
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-forest/30 to-gold/30 text-[10px] font-bold text-forest-light">
          {current.name.slice(0, 1).toUpperCase()}
        </div>
        <span className="max-w-[140px] truncate text-xs font-medium text-stone-900">
          {current.name}
        </span>
        <span className="text-[9px] text-stone-400">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-10 mt-1.5 w-64 overflow-hidden rounded-xl border border-black/10 bg-white shadow-xl shadow-black/10">
          <div className="max-h-56 overflow-y-auto py-1">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => handleSelect(ws)}
                className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs transition hover:bg-black/[0.05] ${
                  ws.id === current.id ? "text-forest-light" : "text-stone-800"
                }`}
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-black/[0.04] text-[10px] font-bold">
                  {ws.name.slice(0, 1).toUpperCase()}
                </div>
                <span className="truncate">{ws.name}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setOpen(false);
              navigate("/workspaces");
            }}
            className="w-full border-t border-black/10 px-3 py-2.5 text-left text-[11px] font-medium text-forest hover:bg-black/[0.04]"
          >
            + New workspace
          </button>
        </div>
      )}
    </div>
  );
}

export default WorkspaceSwitcher;
