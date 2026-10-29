
// Backend wraps every response in ApiResult: { isSuccess, value: { data }, error: { message } }
const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:5000/api";
// Server root without "/api", used by the SignalR hub
export const API_ORIGIN = API_BASE.replace(/\/api\/?$/, "");
const TOKEN_KEY = "mooncake.tokens";

// `pnpm dev:mock` (vite --mode mock) answers every call from the in-browser mock API instead of MoonCake_BE.
export const USE_MOCK = import.meta.env.MODE === "mock" || import.meta.env.VITE_USE_MOCK === "true";
const doFetch = (input: string, init?: RequestInit): Promise<Response> =>
  USE_MOCK ? import("@/mock/server").then(({ mockFetch }) => mockFetch(input, init)) : fetch(input, init);

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code = String(status)) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

interface ApiEnvelope<T> {
  isSuccess: boolean;
  value?: { code: string; message: string; data?: T } | null;
  error?: { code: string; message: string } | null;
}

export function loadTokens(): Tokens | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    return raw ? (JSON.parse(raw) as Tokens) : null;
  } catch {
    return null;
  }
}

export function saveTokens(tokens: Tokens | null) {
  try {
    if (tokens) localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
  }
}

async function parse<T>(response: Response): Promise<{ message: string; data: T | undefined }> {
  let body: ApiEnvelope<T> | null = null;
  try {
    body = (await response.json()) as ApiEnvelope<T>;
  } catch {
  }

  if (!response.ok || !body?.isSuccess) {
    const message =
      body?.error?.message ??
      (response.status === 401 ? "Phiên đăng nhập đã hết hạn." : "Không thể kết nối tới máy chủ.");
    throw new ApiError(message, response.status, body?.error?.code);
  }

  return { message: body.value?.message ?? "", data: body.value?.data };
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  auth?: boolean;
  query?: Record<string, string | number | boolean | null | undefined>;
}

function withQuery(path: string, query: RequestOptions["query"]): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

let refreshing: Promise<Tokens | null> | null = null;

export async function refreshTokens(): Promise<Tokens | null> {
  const current = loadTokens();
  if (!current) return null;

  refreshing ??= doFetch(`${API_BASE}/auth/refresh-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: current.refreshToken }),
  })
    .then((res) => parse<Tokens>(res))
    .then(({ data }) => {
      saveTokens(data ?? null);
      return data ?? null;
    })
    .catch(() => {
      saveTokens(null);
      return null;
    })
    .finally(() => {
      refreshing = null;
    });

  return refreshing;
}

export async function request<T = undefined>(
  path: string,
  { method = "GET", body, auth = false, query }: RequestOptions = {},
): Promise<{ message: string; data: T | undefined }> {
  const isForm = body instanceof FormData;
  const send = (tokens: Tokens | null) =>
    doFetch(`${API_BASE}${withQuery(path, query)}`, {
      method,
      headers: {
        ...(body !== undefined && !isForm ? { "Content-Type": "application/json" } : {}),
        ...(auth && tokens ? { Authorization: `Bearer ${tokens.accessToken}` } : {}),
      },
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });

  let response = await send(loadTokens());

  if (auth && response.status === 401) {
    const renewed = await refreshTokens();
    if (renewed) response = await send(renewed);
  }

  return parse<T>(response);
}
