
const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const validation =
      payload?.errors && typeof payload.errors === "object"
        ? Object.values(payload.errors).flat().join(" ")
        : null;

    throw new Error(validation || payload?.message || `API error ${response.status}`);
  }

  return payload;
}

export const salesApi = {
  get: (path) => request(path),
  post: (path, body = {}) =>
    request(path, { method: "POST", body: JSON.stringify(body) }),
  put: (path, body = {}) =>
    request(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: "DELETE" }),
};

export function unwrap(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return payload?.data ?? payload ?? null;
}

export function withBranch(path, branchId) {
  if (!branchId) return path;
  return `${path}${path.includes("?") ? "&" : "?"}branch_id=${branchId}`;
}

export { API_BASE };
