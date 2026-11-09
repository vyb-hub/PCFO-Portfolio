export interface ExtractResult {
  text: string;
  passwordUsed: string | null; // null = was not encrypted
}

// pdfjs-dist (v4+) references the browser Canvas API's DOMMatrix even along
// some text-extraction-only code paths (certain PDFs use graphics-state
// operators that go through matrix math regardless of whether page.render()
// is ever called). Node has no such global, so without this polyfill,
// extraction throws "DOMMatrix is not defined" for any PDF that hits that
// path. `@thednp/dommatrix` is a minimal, pure-JS, dependency-free,
// actively-maintained shim — no native canvas binary needed, since this app
// only extracts text, never renders.
// Guarded so it's a no-op if some future runtime already provides it.
function ensureDOMMatrixPolyfill(): void {
  if (typeof globalThis.DOMMatrix === "function") return;

  // Under plain Node, require() returns the class directly via this
  // package's CJS build (its package.json properly separates require/import
  // conditions). Bundled by webpack, a require() can still resolve to an
  // ESM interop namespace object — { default: DOMMatrixShim, ... } — which
  // isn't itself callable, so `new DOMMatrix()` would throw "DOMMatrix is
  // not a constructor" even though the assignment above "succeeded". Handle
  // both shapes rather than assuming the require() result is the class.
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
  const mod = require("@thednp/dommatrix") as any;
  const ctor = typeof mod === "function" ? mod : mod?.default;
  if (typeof ctor !== "function") {
    throw new Error("dommatrix polyfill: could not resolve a DOMMatrix constructor from the module");
  }
  globalThis.DOMMatrix = ctor;
}

// Dynamically import the pdfjs-dist legacy ESM build (only works in Node / server)
async function getPdfjsLib() {
  ensureDOMMatrixPolyfill();
  const lib = await import(
    /* webpackIgnore: true */
    "pdfjs-dist/legacy/build/pdf.mjs" as string
  );
  // No real Worker thread in Node — pdfjs falls back to a "fake worker" that
  // runs the worker module in-process instead, but that fallback still does
  // `import(GlobalWorkerOptions.workerSrc)` to load it, so an empty string
  // throws ("No GlobalWorkerOptions.workerSrc specified") rather than
  // disabling anything. Point it at the real worker module instead.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (lib as any).GlobalWorkerOptions.workerSrc = "pdfjs-dist/legacy/build/pdf.worker.mjs";
  return lib as typeof import("pdfjs-dist");
}

function isPasswordError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return /password|encrypt|incorrect/i.test(msg) || (err as any)?.name === "PasswordException";
}

async function extractTextWithPassword(
  buffer: Buffer,
  password?: string
): Promise<string> {
  const pdfjsLib = await getPdfjsLib();

  // Create a fresh Uint8Array copy for every call.
  // pdfjs-dist v5 may transfer (detach) the ArrayBuffer to its worker,
  // making the same Uint8Array unusable on the next attempt.
  const data = new Uint8Array(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loadingTask = pdfjsLib.getDocument({ data, password: (password ?? undefined) as any });
  const pdf = await loadingTask.promise;

  const parts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    parts.push(pageText);
  }

  return parts.join("\n\n");
}

export interface ExtractProgressEvent {
  stage: "detect-encryption" | "derive-password" | "decrypt";
  status: "running" | "done";
  data?: Record<string, unknown>;
}

export async function tryExtractPDFText(
  buffer: Buffer,
  candidates: string[],
  onProgress?: (event: ExtractProgressEvent) => void
): Promise<ExtractResult> {
  // Try without password first — this attempt itself is what tells us
  // whether the PDF is encrypted at all.
  onProgress?.({ stage: "detect-encryption", status: "running" });
  try {
    const text = await extractTextWithPassword(buffer);
    onProgress?.({ stage: "detect-encryption", status: "done", data: { encrypted: false } });
    onProgress?.({ stage: "decrypt", status: "done" });
    return { text, passwordUsed: null };
  } catch (err) {
    if (!isPasswordError(err)) throw err;
  }
  onProgress?.({ stage: "detect-encryption", status: "done", data: { encrypted: true } });

  // Try each candidate with a fresh buffer copy per attempt
  onProgress?.({ stage: "derive-password", status: "running", data: { auto: candidates.length > 0 } });
  for (const pwd of candidates) {
    if (!pwd?.trim()) continue;
    try {
      const text = await extractTextWithPassword(buffer, pwd);
      onProgress?.({ stage: "derive-password", status: "done", data: { auto: true } });
      onProgress?.({ stage: "decrypt", status: "done" });
      return { text, passwordUsed: pwd };
    } catch (err) {
      // Re-throw non-password errors — a correct password that hits a parse
      // error would otherwise be silently swallowed and blamed on the password.
      if (!isPasswordError(err)) throw err;
      // Wrong password — try next
    }
  }

  throw new Error(
    `PDF is password-protected and none of the ${candidates.length} candidate password(s) worked. ` +
    `Please enter the correct password manually, or save your DOB / PAN / Customer ID in Settings → Financial Profile.`
  );
}

// Derive candidate passwords from user profile data
export function derivePasswordCandidates(profile: {
  name?: string | null;
  dateOfBirth?: Date | null;
  pan?: string | null;
  customerIds?: Record<string, string> | null;
  accountNumbers?: Record<string, string> | null;
  manualPassword?: string | null;
}): string[] {
  const candidates: string[] = [];

  // Manual password first (highest priority)
  if (profile.manualPassword?.trim()) {
    candidates.push(profile.manualPassword.trim());
  }

  // Bank-specific formulas (e.g. ICICI: name[0:4] + DDMM)
  const { generateBankPasswords } = require("@/lib/analyzer/bankPasswords") as typeof import("@/lib/analyzer/bankPasswords");
  const bankPwds = generateBankPasswords({
    name: profile.name,
    dateOfBirth: profile.dateOfBirth,
    pan: profile.pan,
    customerIds: profile.customerIds,
    accountNumbers: profile.accountNumbers,
  });
  candidates.push(...bankPwds);

  // Generic DOB variants — covers most other banks
  if (profile.dateOfBirth) {
    const d = profile.dateOfBirth;
    const dd   = String(d.getDate()).padStart(2, "0");
    const mm   = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = String(d.getFullYear());
    const yy   = yyyy.slice(2);
    candidates.push(`${dd}${mm}${yyyy}`); // DDMMYYYY
    candidates.push(`${dd}${mm}${yy}`);   // DDMMYY
    candidates.push(`${mm}${dd}${yyyy}`); // MMDDYYYY
    candidates.push(`${yyyy}${mm}${dd}`); // YYYYMMDD
  }

  // PAN number
  if (profile.pan?.trim()) {
    candidates.push(profile.pan.trim().toUpperCase());
    candidates.push(profile.pan.trim().toLowerCase());
  }

  // Bank Customer IDs
  if (profile.customerIds) {
    for (const id of Object.values(profile.customerIds)) {
      if (id?.trim()) candidates.push(id.trim());
    }
  }

  // Account numbers (full + last 4)
  if (profile.accountNumbers) {
    for (const acc of Object.values(profile.accountNumbers)) {
      if (!acc?.trim()) continue;
      candidates.push(acc.trim());
      if (acc.length > 4) candidates.push(acc.slice(-4));
    }
  }

  return [...new Set(candidates)];
}
