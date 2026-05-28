import AsyncStorage from "@react-native-async-storage/async-storage";

import { apiPath, readJsonOrText, resolveApiBaseUrl } from "./api";
import { getToken } from "./auth";

const SESSION_KEY = "hydra_current_session";

export async function getCurrentSession(): Promise<number | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

export async function saveCurrentSession(sessionId: number): Promise<void> {
  await AsyncStorage.setItem(SESSION_KEY, String(sessionId));
}

export async function clearCurrentSession(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
}

export async function sessionApiJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = await getToken();
  if (!token) {
    throw new Error("Faca login para continuar.");
  }

  const base = resolveApiBaseUrl();
  const url = apiPath(base, `/api${path.startsWith("/") ? path : `/${path}`}`);
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, { ...init, headers });
  const body = await readJsonOrText(response);

  if (!response.ok) {
    const msg =
      body && typeof body === "object" && "error" in body
        ? String((body as { error: string }).error)
        : "Falha na requisicao";
    throw new Error(msg);
  }

  return body as T;
}
