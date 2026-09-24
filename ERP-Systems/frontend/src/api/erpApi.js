const BACKEND_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

const API_URL = `${BACKEND_URL}/api`;

let csrfReady = false;

function getCookie(name) {
  const cookies = document.cookie
    .split(";")
    .map((cookie) => cookie.trim());

  const prefix = `${name}=`;

  const cookie = cookies.find((item) =>
    item.startsWith(prefix)
  );

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(
    cookie.substring(prefix.length)
  );
}

function isWriteMethod(method) {
  return [
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
  ].includes(
    String(method || "GET").toUpperCase()
  );
}

async function ensureCsrfCookie() {
  if (
    csrfReady &&
    getCookie("XSRF-TOKEN")
  ) {
    return;
  }

  const response = await fetch(
    `${BACKEND_URL}/sanctum/csrf-cookie`,
    {
      method: "GET",

      headers: {
        Accept: "application/json",
      },

      credentials: "include",
    }
  );

  if (
    !response.ok &&
    response.status !== 204
  ) {
    throw new Error(
      `Unable to initialize CSRF protection (${response.status}).`
    );
  }

  csrfReady = true;
}

function buildErrorMessage(
  data,
  status
) {
  if (data?.message) {
    return data.message;
  }

  if (data?.error) {
    return data.error;
  }

  if (data?.errors) {
    const messages =
      Object.values(data.errors)
        .flat()
        .filter(Boolean);

    if (messages.length) {
      return messages.join(" ");
    }
  }

  return `Request failed (${status}).`;
}

export async function erpRequest(
  path,
  options = {}
) {
  const method =
    String(
      options.method || "GET"
    ).toUpperCase();

  if (isWriteMethod(method)) {
    await ensureCsrfCookie();
  }

  const headers = {
    Accept: "application/json",
    ...(options.headers || {}),
  };

  const isFormData =
    typeof FormData !== "undefined" &&
    options.body instanceof FormData;

  if (
    options.body &&
    !isFormData &&
    !headers["Content-Type"]
  ) {
    headers["Content-Type"] =
      "application/json";
  }

  if (isWriteMethod(method)) {
    const token =
      getCookie("XSRF-TOKEN");

    if (token) {
      headers["X-XSRF-TOKEN"] =
        token;
    }
  }

  const normalizedPath =
    path.startsWith("/")
      ? path
      : `/${path}`;

  const response = await fetch(
    `${API_URL}${normalizedPath}`,
    {
      ...options,
      method,
      headers,
      credentials: "include",
    }
  );

  const data =
    await response
      .json()
      .catch(() => null);

  if (!response.ok) {
    /*
     * Force a new CSRF cookie on
     * the next write request.
     */
    if (response.status === 419) {
      csrfReady = false;
    }

    const error =
      new Error(
        buildErrorMessage(
          data,
          response.status
        )
      );

    error.status =
      response.status;

    error.data =
      data;

    throw error;
  }

  return data;
}

export async function initializeErpCsrf() {
  await ensureCsrfCookie();
}

export {
  API_URL,
  BACKEND_URL,
};