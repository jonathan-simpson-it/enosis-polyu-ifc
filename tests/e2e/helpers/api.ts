import fs from "fs";
import path from "path";

const API_BASE = "http://localhost:3000/api";

export interface TestUser {
  email: string;
  password: string;
  token: string;
  userId: string;
  orgId: string;
}

let counter = 0;

export function uniqueEmail(): string {
  counter++;
  return `e2e-${Date.now()}-${counter}@enosis.test`;
}

export async function registerUser(
  email: string,
  password = "Test1234!"
): Promise<TestUser> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      org_name: `E2E Org ${counter}`,
      full_name: `E2E User ${counter}`,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Register failed (${res.status}): ${body}`);
  }
  const data = await res.json();
  return {
    email,
    password,
    token: data.access_token,
    userId: data.user_id,
    orgId: data.org_id,
  };
}

export async function uploadDocument(
  token: string,
  filePath: string
): Promise<{ declaration_id: string; filename: string; status: string }> {
  const fileBuffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);
  const blob = new Blob([fileBuffer]);
  const formData = new FormData();
  formData.append("file", blob, fileName);

  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Upload failed (${res.status}): ${body}`);
  }
  return res.json();
}

export async function processDocument(
  token: string,
  declarationId: string
): Promise<any> {
  const res = await fetch(`${API_BASE}/extraction/process/${declarationId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Process failed (${res.status}): ${body}`);
  }
  return res.json();
}

export async function getDocument(
  token: string,
  declarationId: string
): Promise<any> {
  const res = await fetch(`${API_BASE}/documents/${declarationId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Get document failed: ${res.status}`);
  return res.json();
}

export async function approveDocument(
  token: string,
  declarationId: string
): Promise<any> {
  const res = await fetch(`${API_BASE}/extraction/approve/${declarationId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Approve failed (${res.status}): ${body}`);
  }
  return res.json();
}

export async function exportDocument(
  token: string,
  declarationId: string,
  format = "wco_json"
): Promise<any> {
  const res = await fetch(
    `${API_BASE}/export/${declarationId}?format=${format}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Export failed (${res.status}): ${body}`);
  }
  return res.json();
}

export async function submitToTsw(
  token: string,
  declarationId: string
): Promise<any> {
  const res = await fetch(`${API_BASE}/export/${declarationId}/submit`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Submit failed (${res.status}): ${body}`);
  }
  return res.json();
}

export async function deleteDocument(
  token: string,
  declarationId: string
): Promise<void> {
  await fetch(`${API_BASE}/documents/${declarationId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function listDocuments(token: string): Promise<any> {
  const res = await fetch(`${API_BASE}/documents`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`List failed: ${res.status}`);
  return res.json();
}
