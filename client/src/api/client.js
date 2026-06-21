const BASE_URL = import.meta.env.VITE_API_URL;

const TOKEN_KEY = "auth_token";
export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);
export const setStoredToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const removeStoredToken = () => localStorage.removeItem(TOKEN_KEY);

const apiFetch = async (path, options = {}) => {
  const token = getStoredToken();
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}/api${path}`, {
    ...options,
    headers,
    credentials: "include",
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw error;
  }
  return res.json();
};

export const register = async (data) => {
  const result = await apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (result.token) setStoredToken(result.token);
  return result;
};
export const login = async (data) => {
  const result = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (result.token) setStoredToken(result.token);
  return result;
};
export const logout = async () => {
  removeStoredToken();
  return apiFetch("/auth/logout", { method: "POST" });
};
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
export const naturalQuery = (projectId, query) =>
  apiFetch(`/query/${projectId}/natural`, {
    method: "POST",
    body: JSON.stringify({ query }),
  });

export const getClusters = (projectId, params = {}) => {
  const q = new URLSearchParams(params).toString();
  return apiFetch(`/clusters/${projectId}?${q}`);
};

export const analyzeCluster = (projectId, clusterId) =>
  apiFetch(`/clusters/${projectId}/${clusterId}/analyze`, { method: "POST" });
export const getAlertRules = (projectId) =>
  apiFetch(`/alerts/${projectId}/rules`);
export const createAlertRule = (projectId, data) =>
  apiFetch(`/alerts/${projectId}/rules`, {
    method: "POST",
    body: JSON.stringify(data),
  });
export const updateAlertRule = (projectId, ruleId, data) =>
  apiFetch(`/alerts/${projectId}/rules/${ruleId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
export const deleteAlertRule = (projectId, ruleId) =>
  apiFetch(`/alerts/${projectId}/rules/${ruleId}`, { method: "DELETE" });
export const getAlertTriggers = (projectId, params = {}) => {
  const q = new URLSearchParams(params).toString();
  return apiFetch(`/alerts/${projectId}/triggers?${q}`);
};
export const acknowledgeAlert = (projectId, triggerId) =>
  apiFetch(`/alerts/${projectId}/triggers/${triggerId}/ack`, { method: "PUT" });
export const getAnomalies = (projectId, params = {}) => {
  const q = new URLSearchParams(params).toString();
  return apiFetch(`/anomalies/${projectId}?${q}`);
};
export const acknowledgeAnomaly = (projectId, anomalyId) =>
  apiFetch(`/anomalies/${projectId}/${anomalyId}/ack`, { method: "PUT" });
