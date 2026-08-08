const PII_PATTERNS: Record<string, RegExp> = {
  hkid: /[A-Z]\d{6}\(?\d\)?/g,
  phone_hk: /(?:\+852)?\d{8}/g,
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  passport: /\b[A-Z]{2}\d{7}\b/g,
  br_number: /BR-\d{8}/g,
};

export function redactPii(text: string, placeholder = "[REDACTED]"): string {
  let out = text;
  for (const pattern of Object.values(PII_PATTERNS)) {
    out = out.replace(pattern, placeholder);
  }
  return out;
}

const VALID_EXTENSIONS = new Set([
  ".pdf",
  ".xlsx",
  ".xls",
  ".png",
  ".jpg",
  ".jpeg",
  ".tiff",
  ".bmp",
  ".json",
  ".csv",
  ".txt",
]);

export function validateUpload(
  fileBytes: Uint8Array,
  filename: string,
  maxSizeMb = 20
): { valid: boolean; errors: string[]; file_size: number } {
  const errors: string[] = [];
  const fileSize = fileBytes.length;
  const maxBytes = maxSizeMb * 1024 * 1024;

  if (fileSize > maxBytes) {
    errors.push(
      `File exceeds ${maxSizeMb}MB limit (${(fileSize / 1024 / 1024).toFixed(1)}MB)`
    );
  }
  if (fileSize === 0) errors.push("File is empty");

  const dot = filename.lastIndexOf(".");
  const ext = dot >= 0 ? filename.slice(dot).toLowerCase() : "";
  if (ext && !VALID_EXTENSIONS.has(ext)) {
    errors.push(`Unsupported file extension: ${ext}`);
  }

  return { valid: errors.length === 0, errors, file_size: fileSize };
}
