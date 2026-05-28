import { apiPath, resolveApiBaseUrl } from "./api";
import { getToken } from "./auth";

export async function fetchWithAuth(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getToken();
  const headers = new Headers(init.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(apiPath(resolveApiBaseUrl(), path), { ...init, headers });
}
