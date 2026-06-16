const BASE_URL = import.meta.env.VITE_API_URL;

const apiFetch = async (path, options = {}) => {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
    credentials: "include",
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw error;
  }
  return res.json();
};

export const register = (data) =>
  apiFetch("/auth/register", { method: "POST", body: JSON.stringify(data) });
export const login = (data) =>
  apiFetch("/auth/login", { method: "POST", body: JSON.stringify(data) });
export const logout = () => apiFetch("/auth/logout", { method: "POST" });
export const getMe = () => apiFetch("/auth/me");

export const getProjects = () => apiFetch("/projects");
export const createProject = (data) =>
  apiFetch("/projects", { method: "POST", body: JSON.stringify(data) });
export const deleteProject = (id) =>
  apiFetch(`/projects/${id}`, { method: "DELETE" });
export const rotateApiKey = (id) =>
  apiFetch(`/projects/${id}/rotate-key`, { method: "POST" });

export const getLogs = (projectId, params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/logs/${projectId}?${query}`);
};
export const getLogStats = (projectId, params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/logs/${projectId}/stats?${query}`);
};
