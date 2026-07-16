export function getToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
}

export function setToken(token: string): void {
  localStorage.setItem("token", token);
}

export function clearToken(): void {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function getUser(): any | null {
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  }
  return null;
}

export function setUser(user: any): void {
  localStorage.setItem("user", JSON.stringify(user));
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
