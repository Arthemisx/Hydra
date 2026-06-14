import Constants from "expo-constants";
import { Platform } from "react-native";

const DEFAULT_API_BASE_URL =
  Platform.OS === "android" ? "http://10.0.2.2:5000" : "http://localhost:5000";

export function resolveApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (fromEnv) return fromEnv;

  // Build web de producao (servido pelo Caddy): usa a mesma origem.
  if (!__DEV__ && Platform.OS === "web" && typeof window !== "undefined") {
    return window.location.origin;
  }

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

// Novas funções para clima e análise AI
export async function getWeather(lat: number, lon: number): Promise<{ temperature: number; humidity: number; description: string } | null> {
  try {
    const base = resolveApiBaseUrl();
    const url = new URL(apiPath(base, "/api/weather"));
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lon));

    const response = await fetch(url.toString(), { method: "GET" });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function analyzeSession(sessionData: any): Promise<string> {
  try {
    const base = resolveApiBaseUrl();
    const response = await fetch(apiPath(base, "/api/analyze-session"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sessionData),
    });
    const data = await response.json();
    return data.analysis || "Análise indisponível";
  } catch {
    return "Ocorreu um erro ao conectar ao servidor para análise.";
  }
}

export async function chatWithAI(message: string, sessionData: any, chatHistory: any[] = []): Promise<string> {
  try {
    const base = resolveApiBaseUrl();
    const response = await fetch(apiPath(base, "/api/chat"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        sessionData,
        chatHistory,
      }),
    });
    const data = await response.json();
    return data.reply || "Não foi possível obter resposta.";
  } catch {
    return "Ocorreu um erro ao conectar ao servidor para chat.";
  }
}
