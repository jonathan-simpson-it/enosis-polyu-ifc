const USERS = new Map<string, { email: string; fullName: string; token: string }>();

function demoToken(email: string): string {
  return `demo-${Buffer.from(email).toString("base64url")}`;
}

export function getDemoUser(token: string | null) {
  if (!token) return null;
  const tokenValue = token.startsWith("Bearer ") ? token.slice(7) : token;
  if (!tokenValue.startsWith("demo-")) return null;
  const email = Buffer.from(tokenValue.slice(5), "base64url").toString();
  const user = Array.from(USERS.values()).find((u) => u.email === email);
  if (user) return user;
  return { email, fullName: email.split("@")[0], token: tokenValue };
}
