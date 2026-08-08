import { getAuthHeaders, clearToken } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
    ...(options?.headers as Record<string, string>),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Session expired. Redirecting to login.");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail || `Request failed: ${res.status}`);
  }

  return res.json();
}

// ── Types ──

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  org_id: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  org_id: string | null;
  api_key: string | null;
}

export interface Organization {
  id: string;
  name: string;
  br_number: string | null;
  subscription_tier: string;
  usage_limit: number;
  usage_current: number;
}

export interface Commodity {
  id: string;
  description: string | null;
  hs_code: string | null;
  hs_code_confidence: number | null;
  quantity: number | null;
  unit: string | null;
  declared_value: number | null;
  weight: number | null;
  country_of_origin: string | null;
  reviewed: boolean;
}

export interface Declaration {
  id: string;
  filename: string | null;
  file_type: string | null;
  status: string;
  confidence_avg: number | null;
  decl_number: string | null;
  consignor_name: string | null;
  consignee_name: string | null;
  port_of_loading: string | null;
  port_of_discharge: string | null;
  incoterms: string | null;
  total_declared_value: number | null;
  gross_weight: number | null;
  net_weight: number | null;
  number_of_packages: number | null;
  country_of_origin: string | null;
  container_number: string | null;
  declared_currency: string | null;
  transport_mode: string | null;
  commercial_notes: string | null;
  created_at: string | null;
  commodities: Commodity[];
}

export interface UploadResult {
  declaration_id: string;
  filename: string;
  file_type: string;
  status: string;
  char_count: number;
  has_tables: boolean;
  structured_fields: string[];
}

export interface ExtractionResult {
  declaration_id: string;
  status: string;
  confidence_avg: number;
  entities: ExtractionEntities;
  confidence_scores: Record<string, number>;
  needs_review: boolean;
  commodities: Commodity[];
  labeled_fields: Record<string, unknown>;
}

export interface ExtractionEntities {
  hs_codes: string[];
  container_numbers: string[];
  weights: string[];
  values: string[];
  quantities: string[];
  dates: string[];
  countries: string[];
  commodity_descriptions: string[];
  commodities: Commodity[];
  labeled_fields: Record<string, unknown>;
}

export interface ExportResult {
  declaration_id: string;
  format: string;
  export: Record<string, unknown>;
  validation: { valid: boolean; errors?: string[] };
}

export interface SubmitResult {
  declaration_id: string;
  status: string;
  tsw_reference: string;
  submission_id: string;
}

export interface CommodityUpdate {
  id: string;
  hs_code?: string;
  description?: string;
  quantity?: number;
  unit?: string;
  declared_value?: number;
  weight?: number;
  country_of_origin?: string;
}

export interface DocumentListResponse {
  documents: Declaration[];
}

export interface FormatsResponse {
  formats: string[];
}

// ── API Methods ──

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<TokenResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string, orgName?: string, fullName?: string) =>
    request<TokenResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        org_name: orgName || "",
        full_name: fullName || "",
      }),
    }),

  getMe: () => request<UserProfile>("/api/auth/me"),

  regenerateApiKey: () =>
    request<{ api_key: string }>("/api/auth/api-key", {
      method: "POST",
    }),

  // Organizations
  getOrg: (orgId: string) => request<Organization>(`/api/orgs/${orgId}`),

  // Documents
  uploadDocument: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const headers: Record<string, string> = {
      ...getAuthHeaders(),
    };

    const res = await fetch(`${API_BASE}/api/documents/upload`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.detail || `Upload failed: ${res.status}`);
    }

    return res.json() as Promise<UploadResult>;
  },

  listDocuments: () =>
    request<DocumentListResponse>("/api/documents"),

  getDocument: (id: string) =>
    request<Declaration>(`/api/documents/${id}`),

  updateDocument: (id: string, data: Record<string, unknown>) =>
    request<{ status: string; id: string }>(`/api/documents/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteDocument: (id: string) =>
    request<{ status: string }>(`/api/documents/${id}`, {
      method: "DELETE",
    }),

  // Extraction
  processDocument: (id: string) =>
    request<ExtractionResult>(`/api/extraction/process/${id}`, {
      method: "POST",
    }),

  updateCommodities: (updates: CommodityUpdate[]) =>
    request<{ updated: number; commodity_ids: string[] }>("/api/extraction/commodities", {
      method: "PUT",
      body: JSON.stringify(updates),
    }),

  approveDocument: (id: string) =>
    request<{ declaration_id: string; status: string }>(`/api/extraction/approve/${id}`, {
      method: "POST",
    }),

  // Export
  listFormats: () => request<FormatsResponse>("/api/export/formats"),

  exportDocument: (id: string, format: string = "wco_json") =>
    request<ExportResult>(`/api/export/${id}?format=${format}`, {
      method: "POST",
    }),

  submitToTsw: (id: string) =>
    request<SubmitResult>(`/api/export/${id}/submit`, {
      method: "POST",
    }),
};
