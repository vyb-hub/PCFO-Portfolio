"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, FileText, Trash2, Loader2, FileSpreadsheet, KeyRound, Info } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { UploadProgress } from "@/components/analyzer/UploadProgress";
import type { ImportStreamEvent } from "@/lib/analyzer/importTypes";

interface Statement {
  id: string;
  fileName: string;
  fileType: "PDF" | "CSV";
  fileSize: number;
  institutionName: string | null;
  accountType: string | null;
  accountNumber: string | null;
  periodFrom: string | null;
  periodTo: string | null;
  totalDebits: number | null;
  totalCredits: number | null;
  closingBalance: number | null;
  creditLimit: number | null;
  minimumDue: number | null;
  totalDue: number | null;
  currency: string | null;
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  processingError: string | null;
  transactionCount: number | null;
  createdAt: string;
}

function fmt(n: number | null, currency = "INR") {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}

function fmtDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function AnalyzerPage() {
  const [statements, setStatements] = useState<Statement[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const [uploadPhase, setUploadPhase] = useState<"uploading" | "processing" | "done">("uploading");
  const [importEvents, setImportEvents] = useState<ImportStreamEvent[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [manualPassword, setManualPassword] = useState("");
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [hasPDFs, setHasPDFs] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastUploadedFilesRef = useRef<File[]>([]);

  const loadStatements = useCallback(async () => {
    const res = await fetch("/api/analyzer/statements");
    const data = await res.json() as { success: boolean; statements: Statement[] };
    if (data.success) setStatements(data.statements);
    setLoading(false);
  }, []);

  useEffect(() => { void loadStatements(); }, [loadStatements]);

  const stageFiles = (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) =>
      f.name.toLowerCase().endsWith(".pdf") || f.name.toLowerCase().endsWith(".csv")
    );
    if (!arr.length) return;
    setStagedFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      return [...prev, ...arr.filter((f) => !existing.has(f.name))];
    });
    setHasPDFs(arr.some((f) => f.name.toLowerCase().endsWith(".pdf")));
    setImportEvents([]);
  };

  const failAll = (files: File[], message: string, recoverable = true) => {
    setUploadPhase("done");
    setUploading(false);
    setImportEvents((prev) => [
      ...prev,
      {
        type: "complete",
        results: files.map((f) => ({
          file: f.name,
          success: false,
          diagnostic: { code: "UNKNOWN" as const, message, recoverable },
        })),
      },
    ]);
  };

  // Plain fetch() has no upload-progress API and no way to read a streaming
  // response incrementally in a way that also exposes upload progress on the
  // same request. XMLHttpRequest is the only mechanism that gives both:
  // xhr.upload.onprogress for bytes-sent, and xhr.onprogress + growing
  // xhr.responseText for the NDJSON stage events as they arrive.
  const uploadFiles = async (files: File[]) => {
    if (!files.length) return;
    lastUploadedFilesRef.current = files;

    setUploading(true);
    setImportEvents([]);
    setUploadPercent(0);
    setUploadPhase("uploading");

    // A session that expired between page load and submit makes the auth
    // middleware 307-redirect the POST to /login — XHR/fetch don't resend a
    // multipart body across a same-origin redirect gracefully, and the
    // resulting browser-level failure has no useful information in it.
    // Checking first turns that into a clear message instead of a bare
    // "Network error" with no explanation.
    try {
      const sessionRes = await fetch("/api/auth/session");
      const session = (await sessionRes.json()) as { user?: unknown };
      if (!session?.user) {
        failAll(files, "Your session has expired. Please refresh the page and sign in again, then retry.", true);
        return;
      }
    } catch {
      failAll(files, "Couldn't reach the server to start the upload. Check your connection and try again.", true);
      return;
    }

    const form = new FormData();
    for (const f of files) form.append("files", f);
    if (manualPassword.trim()) form.append("password", manualPassword.trim());

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/analyzer/upload");

    let parsedLineCount = 0;
    let sawAnyEvent = false;
    const parseNewLines = (final: boolean) => {
      const text = xhr.responseText;
      const lines = text.split("\n");
      // The last split segment may still be an incomplete line unless this
      // is the final pass after the response has fully arrived.
      const usableLines = final ? lines : lines.slice(0, -1);
      for (let i = parsedLineCount; i < usableLines.length; i++) {
        const line = usableLines[i];
        if (!line) continue;
        try {
          const event = JSON.parse(line) as ImportStreamEvent;
          sawAnyEvent = true;
          setImportEvents((prev) => [...prev, event]);
        } catch {
          // partial line raced with a chunk boundary — skip, it'll be re-read complete next tick
        }
      }
      parsedLineCount = usableLines.length;
    };

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setUploadPercent(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onprogress = () => {
      setUploadPhase((p) => (p === "uploading" ? "processing" : p));
      parseNewLines(false);
    };
    xhr.onload = () => {
      parseNewLines(true);
      // A redirected/non-stream response (e.g. session expired mid-upload,
      // or any other non-2xx) lands here with no parseable NDJSON lines —
      // don't silently show an empty success state.
      if (!sawAnyEvent || xhr.status < 200 || xhr.status >= 300) {
        failAll(
          files,
          xhr.status === 401 || xhr.status === 307
            ? "Your session expired during the upload. Please refresh the page and sign in again, then retry."
            : `Upload failed unexpectedly (status ${xhr.status || "unknown"}). Please try again.`,
          true
        );
      } else {
        setUploadPhase("done");
        setUploading(false);
      }
      if (inputRef.current) inputRef.current.value = "";
      setStagedFiles([]);
      setHasPDFs(false);
      setManualPassword("");
    };
    xhr.onerror = () => {
      failAll(files, "The connection was lost during upload. Check your network and try again.", true);
    };

    xhr.send(form);
  };

  const retryFile = (fileName: string) => {
    const file = lastUploadedFilesRef.current.find((f) => f.name === fileName);
    if (file) void uploadFiles([file]);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await fetch(`/api/analyzer/statements/${id}`, { method: "DELETE" });
    setStatements((prev) => prev.filter((s) => s.id !== id));
    setDeleting(null);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    stageFiles(e.dataTransfer.files);
  }, []);

  return (
    <div className="px-6 py-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-ink mb-1">Statement Analyzer</h1>
      <p className="text-sm text-ink-muted mb-6">Upload bank or credit card statements (PDF or CSV) to extract transactions automatically.</p>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { setHasPDFs(Array.from(e.dataTransfer.files).some((f) => f.name.toLowerCase().endsWith(".pdf"))); onDrop(e); }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "glass-card p-8 mb-4 flex flex-col items-center justify-center gap-3 cursor-pointer",
          "border-2 border-dashed transition-all",
          dragOver
            ? "border-accent-light bg-accent-muted/30"
            : "border-glass-border hover:border-accent-border hover:bg-white/5"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.csv"
          multiple
          className="hidden"
          onChange={(e) => {
            if (!e.target.files) return;
            stageFiles(e.target.files);
          }}
        />
        {uploading ? (
          <>
            <FileText className="w-8 h-8 text-accent-light" />
            <p className="text-sm text-ink-muted">See progress below…</p>
          </>
        ) : stagedFiles.length > 0 ? (
          <>
            <FileText className="w-8 h-8 text-accent-light" />
            <p className="text-sm text-ink">{stagedFiles.length} file{stagedFiles.length > 1 ? "s" : ""} ready</p>
            <p className="text-xs text-ink-muted">{stagedFiles.map((f) => f.name).join(", ")}</p>
          </>
        ) : (
          <>
            <Upload className="w-8 h-8 text-ink-faint" />
            <p className="text-sm text-ink">Drag & drop PDF or CSV files here</p>
            <p className="text-xs text-ink-muted">or click to browse · max 5 MB per file</p>
          </>
        )}
      </div>

      {/* Staged files panel — password + submit */}
      {stagedFiles.length > 0 && (
        <div className="glass-card p-4 mb-4">
          <div className="flex items-start gap-3">
            <KeyRound className="w-4 h-4 text-accent-light mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink mb-1">PDF Password <span className="text-ink-muted font-normal">(optional)</span></p>
              <p className="text-xs text-ink-muted mb-3">
                Leave blank to auto-try from your{" "}
                <Link href="/settings#profile" className="text-accent-light hover:underline">financial profile</Link>
                {" "}(DOB, PAN, Customer ID). Enter it here if you know it.
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <input
                  type="password"
                  value={manualPassword}
                  onChange={(e) => setManualPassword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") void uploadFiles(stagedFiles); }}
                  placeholder="e.g. VYBH1602"
                  className="w-48 px-3 py-2 rounded-xl bg-white/5 border border-glass-border
                             text-sm text-ink placeholder:text-ink-faint focus:outline-none
                             focus:border-accent-border transition-colors"
                />
                <button
                  onClick={() => void uploadFiles(stagedFiles)}
                  disabled={uploading}
                  className="px-4 py-2 rounded-xl bg-accent text-void text-sm font-semibold
                             hover:bg-accent-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Upload {stagedFiles.length > 1 ? `${stagedFiles.length} files` : "file"}
                </button>
                <button
                  onClick={() => { setStagedFiles([]); setHasPDFs(false); setManualPassword(""); }}
                  className="text-xs text-ink-muted hover:text-expense transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-ink-muted">
              <Info className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden sm:block">Auto-tried: DOB · PAN · Customer ID</span>
            </div>
          </div>
        </div>
      )}

      {/* Upload / processing progress */}
      {importEvents.length > 0 && (
        <UploadProgress
          uploadPercent={uploadPercent}
          phase={uploadPhase}
          events={importEvents}
          onRetry={retryFile}
          refreshDashboard={loadStatements}
        />
      )}

      {/* Statement list */}
      <section className="glass-card p-5">
        <h2 className="text-sm font-semibold text-ink mb-4">
          Uploaded Statements
          {statements.length > 0 && (
            <span className="ml-2 text-xs text-ink-muted font-normal">({statements.length})</span>
          )}
        </h2>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-ink-muted py-4">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : statements.length === 0 ? (
          <p className="text-sm text-ink-muted py-4 text-center">No statements uploaded yet.</p>
        ) : (
          <div className="space-y-3">
            {statements.map((s) => (
              <div key={s.id} className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-glass-border">
                {/* Icon */}
                <div className="mt-0.5 flex-shrink-0">
                  {s.fileType === "PDF"
                    ? <FileText className="w-5 h-5 text-accent-light" />
                    : <FileSpreadsheet className="w-5 h-5 text-income" />}
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-ink truncate">{s.institutionName ?? s.fileName}</span>
                    {s.accountType && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 text-ink-muted border border-glass-border uppercase tracking-wide">
                        {s.accountType.replace("_", " ")}
                      </span>
                    )}
                    <StatusBadge status={s.status} />
                  </div>

                  {s.institutionName && (
                    <p className="text-xs text-ink-muted truncate mt-0.5">{s.fileName} · {fmtSize(s.fileSize)}</p>
                  )}

                  {s.status === "FAILED" && s.processingError && (
                    <p className="text-xs text-expense mt-1">{s.processingError}</p>
                  )}

                  {s.status === "COMPLETED" && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-ink-muted">
                      {s.periodFrom && s.periodTo && (
                        <span>{fmtDate(s.periodFrom)} – {fmtDate(s.periodTo)}</span>
                      )}
                      {s.transactionCount != null && (
                        <span>{s.transactionCount} txns</span>
                      )}
                      {s.totalDebits != null && (
                        <span className="text-expense">Debits: {fmt(s.totalDebits, s.currency ?? "INR")}</span>
                      )}
                      {s.totalCredits != null && (
                        <span className="text-income">Credits: {fmt(s.totalCredits, s.currency ?? "INR")}</span>
                      )}
                      {s.closingBalance != null && (
                        <span>Closing: {fmt(s.closingBalance, s.currency ?? "INR")}</span>
                      )}
                      {s.totalDue != null && (
                        <span className="text-expense">Due: {fmt(s.totalDue, s.currency ?? "INR")}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Delete */}
                <button
                  onClick={() => void handleDelete(s.id)}
                  disabled={deleting === s.id}
                  className="flex-shrink-0 p-1.5 rounded-lg hover:bg-expense-muted text-ink-faint hover:text-expense transition-all disabled:opacity-40"
                >
                  {deleting === s.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: Statement["status"] }) {
  if (status === "COMPLETED")
    return <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-income-muted text-income border border-income-border">Done</span>;
  if (status === "FAILED")
    return <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-expense-muted text-expense border border-expense-border">Failed</span>;
  return <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-warning-muted text-warning border border-warning/30">Processing</span>;
}
