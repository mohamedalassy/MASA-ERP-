const API_BASE =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

const API_ORIGIN = API_BASE.replace(/\/api\/?$/, "");

let csrfPromise = null;

function getCookie(name) {
  const value = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")
    .slice(1)
    .join("=");

  return value ? decodeURIComponent(value) : "";
}

async function ensureCsrfCookie() {
  if (getCookie("XSRF-TOKEN")) return;

  if (!csrfPromise) {
    csrfPromise = fetch(`${API_ORIGIN}/sanctum/csrf-cookie`, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    }).finally(() => {
      csrfPromise = null;
    });
  }

  await csrfPromise;
}

async function request(path, options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  const isWrite = !["GET", "HEAD", "OPTIONS"].includes(method);

  if (isWrite) {
    await ensureCsrfCookie();
  }

  const headers = {
    Accept: "application/json",
    ...(options.body !== undefined
      ? { "Content-Type": "application/json" }
      : {}),
    ...(options.headers || {}),
  };

  if (isWrite) {
    const token = getCookie("XSRF-TOKEN");

    if (token) {
      headers["X-XSRF-TOKEN"] = token;
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
    method,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";

  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => ({}))
    : await response.text().catch(() => "");

  if (!response.ok) {
    const validation =
      payload?.errors && typeof payload.errors === "object"
        ? Object.values(payload.errors).flat().join(" ")
        : null;

    const message =
      validation ||
      payload?.message ||
      (typeof payload === "string" && payload) ||
      `API error ${response.status}`;

    const error = new Error(message);

    error.status = response.status;
    error.payload = payload;

    throw error;
  }

  return payload;
}

function jsonBody(body) {
  return body === undefined ? undefined : JSON.stringify(body);
}

export const salesApi = {
  get(path, options = {}) {
    return request(path, {
      ...options,
      method: "GET",
    });
  },

  post(path, body = {}, options = {}) {
    return request(path, {
      ...options,
      method: "POST",
      body: jsonBody(body),
    });
  },

  put(path, body = {}, options = {}) {
    return request(path, {
      ...options,
      method: "PUT",
      body: jsonBody(body),
    });
  },

  patch(path, body = {}, options = {}) {
    return request(path, {
      ...options,
      method: "PATCH",
      body: jsonBody(body),
    });
  },

  delete(path, body, options = {}) {
    return request(path, {
      ...options,
      method: "DELETE",
      ...(body !== undefined
        ? { body: jsonBody(body) }
        : {}),
    });
  },
};

export function unwrap(payload) {
  if (Array.isArray(payload)) return payload;

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.data?.data)) {
    return payload.data.data;
  }

  return payload?.data ?? payload ?? null;
}

export function withBranch(path, branchId) {
  if (!branchId) return path;

  const separator = path.includes("?") ? "&" : "?";

  return `${path}${separator}branch_id=${encodeURIComponent(
    branchId
  )}`;
}

export function buildQuery(path, params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return;
    }

    query.set(key, String(value));
  });

  const suffix = query.toString();

  if (!suffix) return path;

  return `${path}${path.includes("?") ? "&" : "?"}${suffix}`;
}

export { API_BASE, API_ORIGIN };