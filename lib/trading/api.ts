export const API_BASE = process.env.NEXT_PUBLIC_TRADING_API_URL || "http://127.0.0.1:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
};

export function fmtPct(v: number | null | undefined, digits = 0) {
  if (v === null || v === undefined) return "n/a";
  return `${(v * 100).toFixed(digits)}%`;
}

export function fmtNum(v: number | null | undefined, digits = 2) {
  if (v === null || v === undefined) return "n/a";
  return v.toFixed(digits);
}

export function fmtInt(v: number | null | undefined) {
  if (v === null || v === undefined) return "n/a";
  return v.toLocaleString("en-US");
}

export function fmtUsd(v: number | null | undefined) {
  if (v === null || v === undefined) return "n/a";
  return `$${v.toFixed(2)}`;
}