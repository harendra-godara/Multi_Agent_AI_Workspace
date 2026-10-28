const KEY = "workspaceId";

export function getCurrentWorkspaceId() {
  return localStorage.getItem(KEY);
}

export function setCurrentWorkspaceId(id) {
  localStorage.setItem(KEY, id);
}
