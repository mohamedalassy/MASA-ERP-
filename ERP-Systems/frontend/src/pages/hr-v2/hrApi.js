import { erpRequest } from "../../api/erpApi";

export async function hrApi(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    return await erpRequest(path, { ...options, headers });
  } catch (error) {
    const validation = error.data?.errors
      ? Object.values(error.data.errors).flat().filter(Boolean).join(" ")
      : "";
    if (validation) error.message = validation;
    throw error;
  }
}

export const hrGet = (path) => hrApi(path);
export const hrPost = (path, data = {}) => hrApi(path, { method: "POST", body: JSON.stringify(data) });
export const hrPut = (path, data = {}) => hrApi(path, { method: "PUT", body: JSON.stringify(data) });
export const hrPatch = (path, data = {}) => hrApi(path, { method: "PATCH", body: JSON.stringify(data) });
export const hrDelete = (path) => hrApi(path, { method: "DELETE" });
