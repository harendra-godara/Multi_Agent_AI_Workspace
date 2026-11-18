import {
  getCurrentWorkspaceId,
  setCurrentWorkspaceId,
  clearCurrentWorkspaceId,
} from "./workspace";

// Express backend (see backend/README.md and backend/docs/openapi.yaml). Must end with /api.
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Demo mode is OFF by default, so real errors (wrong password, 409, 403...) reach the UI.
// Set VITE_DEMO_MODE=true in frontend/.env to show mock data without a backend.
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

function getToken() {
  return localStorage.getItem("token");
}

function clearSession() {
  localStorage.removeItem("token");
  clearCurrentWorkspaceId();
}

async function request(path, options = {}) {
  const token = getToken();
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError("Cannot reach the server. Is the backend running?", 0);
  }

  // Token expired or revoked (logout, logout-all): send the user back to the login page.
  const isAuthCall = path.startsWith("/auth/login") || path.startsWith("/auth/register");
  if (res.status === 401 && token && !isAuthCall) {
    clearSession();
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.assign("/login");
    }
    throw new ApiError("Your session has expired. Please log in again.", 401);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.message || `Request failed (${res.status})`, res.status);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function withDemo(real, mockValue) {
  try {
    return await real();
  } catch (err) {
    if (DEMO_MODE) {
      console.warn(`[demo mode] using mock data (${err.message})`);
      return typeof mockValue === "function" ? mockValue() : mockValue;
    }
    throw err;
  }
}

function requestWithFallback(path, options, mockValue) {
  return withDemo(() => request(path, options), mockValue);
}

// ---------- tasks: backend statuses -> the labels the UI already uses ----------

const STATUS_LABEL = {
  pending: "Queued",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
};

function timeAgo(iso) {
  if (!iso) return "";
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString();
}

function normalizeTask(t) {
  return {
    id: t.id,
    title: t.title,
    description: t.description || "",
    status: STATUS_LABEL[t.status] || t.status,
    rawStatus: t.status,
    time: timeAgo(t.created_at),
  };
}

// The UI has one free-text box; the backend wants a short title (max 200) and a description.
function titleFrom(text) {
  const firstLine = text.split("\n").find((line) => line.trim()) || text;
  const clean = firstLine.replace(/\s+/g, " ").trim();
  return clean.length > 80 ? `${clean.slice(0, 77)}...` : clean;
}

// ---------- demo data (only used when VITE_DEMO_MODE=true) ----------

const MOCK_TASKS = [
  { id: "1", title: "Build secure REST API", status: "Completed", rawStatus: "completed", time: "Today" },
  { id: "2", title: "Design user database schema", status: "Running", rawStatus: "running", time: "Yesterday" },
  { id: "3", title: "Generate API test suite", status: "Completed", rawStatus: "completed", time: "Yesterday" },
];

// The AI Agent Service is not connected to the backend yet, so this list stays static.
const MOCK_AGENTS = [
  { name: "Research Agent", role: "Requirements & technical research", status: "Ready", tasks: "12 tasks" },
  { name: "Coding Agent", role: "Software implementation", status: "Ready", tasks: "9 tasks" },
  { name: "Database Agent", role: "Schema & persistence", status: "Ready", tasks: "6 tasks" },
  { name: "Testing Agent", role: "Test generation & validation", status: "Ready", tasks: "5 tasks" },
  { name: "Review Agent", role: "Output comparison & correction", status: "Ready", tasks: "4 tasks" },
];

let mockWorkspaces = [
  { id: "ws-1", name: "Personal Project", description: "Default workspace", role: "Owner", members: 1 },
];

let mockMembers = {
  "ws-1": [{ id: "m-1", name: "You", email: "you@example.com", role: "Owner", status: "Active" }],
};

// ---------- api ----------

let workspaceLookup = null;

export const api = {
  register: (data) =>
    requestWithFallback(
      "/auth/register",
      { method: "POST", body: JSON.stringify(data) },
      () => ({ token: "demo-token", name: data.name })
    ),

  login: (data) =>
    requestWithFallback(
      "/auth/login",
      { method: "POST", body: JSON.stringify(data) },
      () => ({ token: "demo-token", name: data.email.split("@")[0] })
    ),

  // Revokes the token on the server (so it cannot be reused), then forgets it locally.
  logout: async () => {
    try {
      await request("/auth/logout", { method: "POST" });
    } catch {
      // already logged out / server down: still clear the local session
    }
    clearSession();
  },

  getTasks: () =>
    withDemo(async () => {
      const workspaceId = await resolveWorkspaceId();
      const list = await request(`/tasks?workspaceId=${workspaceId}&limit=100`);
      return list.map(normalizeTask);
    }, () => MOCK_TASKS),

  // "Run task": creates the task in the current workspace, then starts a run.
  // If the run cannot start (for example it is blocked), the task stays "Queued".
  createTask: (description) =>
    withDemo(async () => {
      const workspaceId = await resolveWorkspaceId();
      const text = description.trim();
      const task = await request("/tasks", {
        method: "POST",
        body: JSON.stringify({ workspaceId, title: titleFrom(text), description: text }),
      });
      try {
        const started = await request(`/tasks/${task.id}/run`, { method: "POST" });
        return normalizeTask({ ...task, status: started.task.status });
      } catch {
        return normalizeTask(task);
      }
    }, () => ({ id: `${Date.now()}`, title: description, status: "Queued", rawStatus: "pending", time: "Just now" })),

  // No backend endpoint yet: the AI Agent Service will provide this.
  getAgents: async () => MOCK_AGENTS,

  getWorkspaces: () =>
    requestWithFallback("/workspaces", undefined, () => mockWorkspaces),

  createWorkspace: (data) =>
    requestWithFallback(
      "/workspaces",
      { method: "POST", body: JSON.stringify(data) },
      () => {
        const workspace = {
          id: `ws-${Date.now()}`,
          name: data.name,
          description: data.description || "",
          role: "Owner",
          members: 1,
        };
        mockWorkspaces = [workspace, ...mockWorkspaces];
        mockMembers[workspace.id] = [
          { id: `m-${Date.now()}`, name: "You", email: "you@example.com", role: "Owner", status: "Active" },
        ];
        return workspace;
      }
    ),

  getMembers: (workspaceId) =>
    requestWithFallback(`/workspaces/${workspaceId}/members`, undefined, () => mockMembers[workspaceId] || []),

  inviteMember: (workspaceId, data) =>
    requestWithFallback(
      `/workspaces/${workspaceId}/invite`,
      { method: "POST", body: JSON.stringify(data) },
      () => {
        const invite = {
          id: `m-${Date.now()}`,
          name: data.email.split("@")[0],
          email: data.email,
          role: data.role || "Member",
          status: "Pending",
        };
        mockMembers[workspaceId] = [...(mockMembers[workspaceId] || []), invite];
        const ws = mockWorkspaces.find((w) => w.id === workspaceId);
        if (ws) ws.members = (mockMembers[workspaceId] || []).length;
        return invite;
      }
    ),

  // Invitations addressed to the logged-in user's email.
  getInvites: () => requestWithFallback("/invites", undefined, () => []),

  acceptInvite: (inviteId) =>
    requestWithFallback(`/invites/${inviteId}/accept`, { method: "POST" }, () => null),

  declineInvite: (inviteId) =>
    requestWithFallback(`/invites/${inviteId}/decline`, { method: "POST" }, () => null),
};

// Returns the id of the workspace the user is working in. Uses the saved one if the user is
// still a member, otherwise the first workspace, otherwise creates a default one (first login).
// Concurrent callers share one lookup, so a new user never gets two default workspaces.
export function resolveWorkspaceId() {
  if (!workspaceLookup) {
    workspaceLookup = (async () => {
      const list = await api.getWorkspaces();
      let workspace = list.find((w) => w.id === getCurrentWorkspaceId()) || list[0];
      if (!workspace) {
        workspace = await api.createWorkspace({
          name: "My Workspace",
          description: "Default workspace",
        });
      }
      setCurrentWorkspaceId(workspace.id);
      return workspace.id;
    })().finally(() => {
      workspaceLookup = null;
    });
  }
  return workspaceLookup;
}
