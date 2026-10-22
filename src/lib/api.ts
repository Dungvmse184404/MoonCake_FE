// Client gọi MoonCake_BE. Backend luôn bọc kết quả trong ApiResult:
//   thành công: { isSuccess: true,  value: { code, message, data? } }
//   thất bại:   { isSuccess: false, error: { code, message } }

// Mặc định gọi thẳng tới API chạy ở cổng 8080 (container Docker). Đổi bằng VITE_API_BASE_URL trong .env.
// Backend phải bật CORS cho origin của FE (Cors:AllowedOrigins trong appsettings.json).
const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8080/api";
const TOKEN_KEY = "mooncake.tokens";

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
    // localStorage có thể bị chặn; phiên đăng nhập chỉ sống trong tab này.
  }
}

async function parse<T>(response: Response): Promise<{ message: string; data: T | undefined }> {
  let body: ApiEnvelope<T> | null = null;
  try {
    body = (await response.json()) as ApiEnvelope<T>;
  } catch {
    // Không phải JSON (ví dụ 401 từ middleware JWT không có body)
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
}

let refreshing: Promise<Tokens | null> | null = null;

async function refreshTokens(): Promise<Tokens | null> {
  const current = loadTokens();
  if (!current) return null;

  // Gộp nhiều request 401 cùng lúc thành một lần refresh.
  refreshing ??= fetch(`${API_BASE}/auth/refresh-token`, {
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
  { method = "GET", body, auth = false }: RequestOptions = {},
): Promise<{ message: string; data: T | undefined }> {
  const send = (tokens: Tokens | null) =>
    fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(auth && tokens ? { Authorization: `Bearer ${tokens.accessToken}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let response = await send(loadTokens());

  if (auth && response.status === 401) {
    const renewed = await refreshTokens();
    if (renewed) response = await send(renewed);
  }

  return parse<T>(response);
}
