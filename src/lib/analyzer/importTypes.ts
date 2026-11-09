// Shared shapes for the statement upload NDJSON stream. The backend emits
// these as it works through /api/analyzer/upload's existing per-file logic;
// the frontend renders them as-is (title/status/data come from the server,
// never hardcoded client-side) so adding a stage later is additive here and
// on the backend, no frontend change required.

export type ImportStage =
  | "upload"
  | "detect-bank"
  | "detect-encryption"
  | "derive-password"
  | "decrypt"
  | "extract"
  | "categorise"
  | "financial-intelligence"
  | "closing-match";

export type DiagnosticCode =
  | "PASSWORD_FAILED"
  | "PDF_CORRUPTED"
  | "AI_TIMEOUT"
  | "SERVER_TIMEOUT"
  | "UNSUPPORTED_FILE"
  | "UNKNOWN";

export interface UploadDiagnostic {
  code: DiagnosticCode;
  message: string;
  recoverable: boolean;
}

export interface StageEvent {
  type: "stage";
  file: string;
  stage: ImportStage;
  title: string;
  status: "running" | "done" | "error";
  data?: Record<string, unknown>;
  diagnostic?: UploadDiagnostic;
}

export interface FileImportReport {
  file: string;
  success: boolean;
  statementId?: string;
  transactionsCreated?: number;
  diagnostic?: UploadDiagnostic;
}

export interface ImportCompleteEvent {
  type: "complete";
  results: FileImportReport[];
}

export type ImportStreamEvent = StageEvent | ImportCompleteEvent;

export const STAGE_TITLES: Record<ImportStage, string> = {
  upload: "Uploading file",
  "detect-bank": "Detecting bank",
  "detect-encryption": "Detecting encryption",
  "derive-password": "Deriving password",
  decrypt: "Decrypting PDF",
  extract: "Extracting transactions",
  categorise: "Categorising transactions",
  "financial-intelligence": "Updating Financial Intelligence",
  "closing-match": "Checking Monthly Closing",
};

export function classifyUploadError(err: unknown): UploadDiagnostic {
  const msg = err instanceof Error ? err.message : String(err);

  if (/password-protected and none of the/i.test(msg)) {
    return { code: "PASSWORD_FAILED", message: msg, recoverable: true };
  }
  if (/timed out|timeout/i.test(msg)) {
    return { code: "SERVER_TIMEOUT", message: "Processing took too long and timed out.", recoverable: true };
  }
  if (/invalid pdf|corrupt|failed to parse/i.test(msg)) {
    return { code: "PDF_CORRUPTED", message: "This PDF could not be read — it may be corrupted or unsupported.", recoverable: false };
  }
  if (/AI_DISABLED|unexpected response type/i.test(msg)) {
    return { code: "AI_TIMEOUT", message: "The AI extraction step failed. Please try again.", recoverable: true };
  }
  return { code: "UNKNOWN", message: msg, recoverable: true };
}
