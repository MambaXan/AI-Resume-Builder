import {
  TokenResponse,
  AuthCredentials,
  RegisterPayload,
  User,
  Resume,
} from "../types";

const BASE_URL = "http://127.0.0.1:8000";
const TOKEN_KEY = "resume_builder_token";
const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

// ─── Token helpers ────────────────────────────────────────────────────────────

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string): void => localStorage.setItem(TOKEN_KEY, t);
export const removeToken = (): void => localStorage.removeItem(TOKEN_KEY);

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

type OnUnauthorized = () => void;
let unauthorizedCallback: OnUnauthorized | null = null;

/** Register a callback that fires whenever the API returns 401. */
export function onUnauthorized(cb: OnUnauthorized): void {
  unauthorizedCallback = cb;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  withAuth = true
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (withAuth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    removeToken();
    unauthorizedCallback?.();
    throw { detail: "Session expired. Please log in again.", status: 401 };
  }

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      // ignore parse errors
    }
    throw { detail, status: res.status };
  }

  // 204 No Content
  if (res.status === 204) return undefined as unknown as T;

  return res.json() as Promise<T>;
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

export const authApi = {
  async login(credentials: AuthCredentials): Promise<TokenResponse> {
    // FastAPI OAuth2 expects form-data for /token
    const form = new URLSearchParams();
    form.append("username", credentials.email);
    form.append("password", credentials.password);

    const res = await fetch(`${BASE_URL}/auth/token`, {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw { detail: body.detail ?? "Login failed", status: res.status };
    }

    const data: TokenResponse = await res.json();
    setToken(data.access_token);
    return data;
  },

  async register(payload: RegisterPayload): Promise<User> {
    return request<User>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      false
    );
  },

  logout(): void {
    removeToken();
  },

  async me(): Promise<User> {
    return request<User>("/users/me");
  },
};

// ─── Resume API ───────────────────────────────────────────────────────────────

export const resumeApi = {
  list(): Promise<Resume[]> {
    return request<Resume[]>("/resumes/", { method: "GET" }); // Убедись, что GET и есть слэш в конце
  },

  get(id: number): Promise<Resume> {
    return request<Resume>(`/resumes/${id}`);
  },

  create(data: Resume): Promise<Resume> {
    return request<Resume>("/resumes/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update(id: number, data: Resume): Promise<Resume> {
    return request<Resume>(`/resumes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete(id: number): Promise<void> {
    return request<void>(`/resumes/${id}`, { method: "DELETE" });
  },
};
