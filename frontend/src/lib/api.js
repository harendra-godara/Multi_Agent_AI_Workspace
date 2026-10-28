const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// DEMO MODE: until the Express backend is live, every call below falls back
// to mock data instead of throwing, so the UI stays usable on its own.
// Once the backend is running, set VITE_API_URL in a .env file — real
// responses take over automatically and this fallback stops triggering.
const DEMO_MODE = true;

function getToken() {
  return localStorage.getItem("token");
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed (${res.status})`);
  }
  return res.json();
}

async function requestWithFallback(path, options, mockValue) {
  try {
    return await request(path, options);
  } catch (err) {
    if (DEMO_MODE) {
      console.warn(`[demo mode] backend unreachable for ${path}, using mock data`);
      return typeof mockValue === "function" ? mockValue() : mockValue;
    }
    throw err;
  }
}

const MOCK_TASKS = [
  { id: "1", title: "Build secure REST API", status: "Completed", time: "Today" },
  { id: "2", title: "Design user database schema", status: "In review", time: "Yesterday" },
  { id: "3", title: "Generate API test suite", status: "Completed", time: "Yesterday" },
];

const MOCK_AGENTS = [
  { name: "Research Agent", role: "Requirements & technical research", status: "Ready", tasks: "12 tasks" },
  { name: "Coding Agent", role: "Software implementation", status: "Ready", tasks: "9 tasks" },
  { name: "Database Agent", role: "Schema & persistence", status: "Ready", tasks: "6 tasks" },
  { name: "Testing Agent", role: "Test generation & validation", status: "Ready", tasks: "5 tasks" },
  { name: "Review Agent", role: "Output comparison & correction", status: "Ready", tasks: "4 tasks" },
];

// In-memory demo store for workspaces/members so create + invite feel real
// within a session, even without a backend. Real data replaces this once
// DEMO_MODE is off.
let mockWorkspaces = [
  { id: "ws-1", name: "Personal Project", description: "Default workspace", role: "Owner", members: 1 },
];

let mockMembers = {
  "ws-1": [
    { id: "m-1", name: "You", email: "you@example.com", role: "Owner", status: "Active" },
  ],
};

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

  getTasks: () => requestWithFallback("/tasks", undefined, () => MOCK_TASKS),

  createTask: (description) =>
    requestWithFallback(
      "/tasks",
      { method: "POST", body: JSON.stringify({ description }) },
      () => ({ id: `${Date.now()}`, title: description, status: "Queued", time: "Just now" })
    ),

  getAgents: () => requestWithFallback("/agents", undefined, () => MOCK_AGENTS),

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
};
