const API_URL = "/api/ai-sales";

let csrfReady = false;

function getCookie(name) {
  const cookies = document.cookie
    .split("; ")
    .find((row) =>
      row.startsWith(`${name}=`)
    );

  if (!cookies) {
    return null;
  }

  return decodeURIComponent(
    cookies.substring(name.length + 1)
  );
}

async function ensureCsrfCookie() {
  const existingToken =
    getCookie("XSRF-TOKEN");

  if (csrfReady && existingToken) {
    return;
  }

  const response = await fetch(
    "/sanctum/csrf-cookie",
    {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok && response.status !== 204) {
    throw new Error(
      `Unable to initialize CSRF protection (${response.status})`
    );
  }

  csrfReady = true;
}

function isWriteMethod(method) {
  return [
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
  ].includes(method.toUpperCase());
}

export async function aiSalesRequest(
  path,
  options = {}
) {
  const method = (
    options.method || "GET"
  ).toUpperCase();

  if (isWriteMethod(method)) {
    await ensureCsrfCookie();
  }

  const headers = {
    Accept: "application/json",
    ...(options.headers || {}),
  };

  if (
    options.body &&
    !(options.body instanceof FormData)
  ) {
    headers["Content-Type"] =
      headers["Content-Type"] ||
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

  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,
      method,
      headers,
      credentials: "include",
    }
  );

  const data = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    if (response.status === 419) {
      csrfReady = false;
    }

    const message =
      data?.message ||
      data?.error ||
      Object.values(
        data?.errors || {}
      )
        .flat()
        .join(" ") ||
      `Request failed (${response.status})`;

    const error = new Error(message);

    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
}

export async function initializeAiSalesCsrf() {
  await ensureCsrfCookie();
}

export { API_URL };