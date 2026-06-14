import Constants from "expo-constants";
import { Platform } from "react-native";

const DEFAULT_API_BASE_URL =
  Platform.OS === "android" ? "http://10.0.2.2:5000" : "http://localhost:5000";

export function resolveApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (fromEnv) return fromEnv;

  // Build web de producao (servido pelo nginx): usa a mesma origem e o proxy /api.
  if (!__DEV__ && Platform.OS === "web") return "";

  if (__DEV__ && Platform.OS !== "web") {
    const debuggerHost = Constants.debuggerHost;
    if (debuggerHost) {
      const host = debuggerHost.split(":")[0];
      if (host && host !== "localhost" && host !== "127.0.0.1") {
        return `http://${host}:5000`;
      }
    }
  }

  return DEFAULT_API_BASE_URL;
}

export async function readJsonOrText(response: Response) {
  const raw = await response.text();
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return { _nonJsonBody: raw.slice(0, 240) };
  }
}

export function apiPath(base: string, path: string) {
  const b = base.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}
