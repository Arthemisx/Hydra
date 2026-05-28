import AsyncStorage from "@react-native-async-storage/async-storage";

import { apiPath, readJsonOrText, resolveApiBaseUrl } from "./api";

const TOKEN_KEY = "hydra_token";
const USER_KEY = "hydra_user";

export type User = {
  id: number;
  name: string;
  email: string;
  role: "athlete" | "team";
  sport?: string | null;
};

type AuthResponse = {
  token: string;
  user: User;
};

async function persistAuth(data: AuthResponse) {
  await AsyncStorage.setItem(TOKEN_KEY, data.token);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getCurrentUser(): Promise<User | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export async function login(email: string, password: string): Promise<User> {
  const base = resolveApiBaseUrl();
  const response = await fetch(apiPath(base, "/api/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = await readJsonOrText(response);
  if (!response.ok) {
    const msg =
      body && typeof body === "object" && "error" in body
        ? String((body as { error: string }).error)
        : "Credenciais invalidas";
    throw new Error(msg);
  }
  const data = body as AuthResponse;
  await persistAuth(data);
  return data.user;
}

export async function register(
  name: string,
  email: string,
  password: string,
  role: "athlete" | "team",
  sport?: string,
): Promise<User> {
  const base = resolveApiBaseUrl();
  const response = await fetch(apiPath(base, "/api/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, role, sport }),
  });
  const body = await readJsonOrText(response);
  if (!response.ok) {
    const msg =
      body && typeof body === "object" && "error" in body
        ? String((body as { error: string }).error)
        : "Falha no cadastro";
    throw new Error(msg);
  }
  const data = body as AuthResponse;
  await persistAuth(data);
  return data.user;
}

export async function logout(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}
