const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

const headers = {
  "Content-Type": "application/json",
  "X-API-Key": process.env.NEXT_PUBLIC_API_KEY || "dev-api-key-123456",
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...options?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

export type ServiceStatus = {
  database: string;
  deepseek_api: string;
};

export type HealthResponse = {
  status: string;
  version: string;
  services: ServiceStatus;
};

export type IngestRequest = {
  clinic_id?: string;
  clinic_name?: string;
  cms_type?: string;
  cms_url?: string;
  patient_ids?: string[];
};

export type IngestResponse = {
  job_id: string;
  status: string;
  patients_scraped: number;
  estimated_time: number;
};

export type IngestStatusResponse = {
  job_id: string;
  status: string;
  patients_found: number;
  patients_extracted: number;
  data: Record<string, unknown>[];
};

export type DiagnosisInput = {
  code?: string;
  description: string;
};

export type MedicationInput = {
  name: string;
  dosage?: string;
  frequency?: string;
};

export type LabResultInput = {
  test: string;
  value: string;
  unit?: string;
  reference?: string;
};

export type TranslateRequest = {
  clinic_id: string;
  patient_id: string;
  patient_data: Record<string, unknown>;
  diagnoses?: DiagnosisInput[];
  medications?: MedicationInput[];
  lab_results?: LabResultInput[];
  clinical_notes?: string;
};

export type TranslationEntry = {
  original: string;
  translated: string;
  mapped_code: string;
  mapping_standard: string;
  confidence: number;
};

export type TokenUsage = {
  input_tokens: number;
  output_tokens: number;
};

export type TranslateResponse = {
  job_id: string;
  status: string;
  fhir_bundle: Record<string, unknown>;
  translations: TranslationEntry[];
  token_usage?: TokenUsage;
};

export type UploadRequest = {
  clinic_id: string;
  patient_id: string;
  fhir_bundle: Record<string, unknown>;
  patient_consent?: boolean;
};

export type UploadResponse = {
  upload_id: string;
  status: string;
  ehealth_reference: string;
  message: string;
};

export type UploadStatusResponse = {
  upload_id: string;
  status: string;
  ehealth_reference?: string;
  uploaded_at?: string;
};

export type LevelHistory = {
  level: string;
  achieved: boolean;
  date?: string;
};

export type CertificationResponse = {
  clinic_id: string;
  clinic_name: string;
  current_level: string;
  level_name?: string;
  records_uploaded: number;
  accuracy_rate: number;
  badge_url?: string;
  next_level?: {
    level?: string;
    name?: string;
    records_required?: number;
    accuracy_required?: number;
    achieved?: boolean;
  };
  progress: number;
  levels: LevelHistory[];
};

export const api = {
  health: () => request<HealthResponse>("/health"),

  ingest: (data: IngestRequest) =>
    request<IngestResponse>("/api/v1/ingest", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  ingestStatus: (jobId: string) =>
    request<IngestStatusResponse>(`/api/v1/ingest/${jobId}/status`),

  translate: (data: TranslateRequest) =>
    request<TranslateResponse>("/api/v1/translate", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  upload: (data: UploadRequest) =>
    request<UploadResponse>("/api/v1/upload", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  uploadStatus: (uploadId: string) =>
    request<UploadStatusResponse>(`/api/v1/upload/${uploadId}/status`),

  certification: (clinicId: string) =>
    request<CertificationResponse>(`/api/v1/certification/${clinicId}`),
};
