import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LEN = 32;
const IV_LEN = 12;
const TAG_LEN = 16;
const ENCODING = "base64url";

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw || raw.length < 64) {
    throw new Error("ENCRYPTION_KEY must be set (min 64 hex chars)");
  }
  return Buffer.from(raw, "hex").subarray(0, KEY_LEN);
}

// Derives a field-specific key via HKDF — each sensitive field gets its own key.
function deriveKey(context: string): Buffer {
  const master = getKey();
  return Buffer.from(crypto.hkdfSync("sha256", master, Buffer.alloc(0), context, KEY_LEN));
}

function getPanKey(): Buffer { return deriveKey("pcfo-pan-v1"); }

function encryptWithKey(key: Buffer, plaintext: string): string {
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LEN });
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString(ENCODING);
}

function decryptWithKey(key: Buffer, ciphertext: string): string {
  const payload = Buffer.from(ciphertext, ENCODING);
  const iv = payload.subarray(0, IV_LEN);
  const tag = payload.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const encrypted = payload.subarray(IV_LEN + TAG_LEN);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LEN });
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

/**
 * Encrypt plaintext → base64url-encoded ciphertext with IV and auth tag.
 * Format: iv(12) + tag(16) + ciphertext — all concatenated then base64url-encoded.
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: TAG_LEN,
  });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  const payload = Buffer.concat([iv, tag, encrypted]);
  return payload.toString(ENCODING);
}

/**
 * Decrypt a value produced by `encrypt()`.
 */
export function decrypt(ciphertext: string): string {
  const key = getKey();
  const payload = Buffer.from(ciphertext, ENCODING);

  const iv = payload.subarray(0, IV_LEN);
  const tag = payload.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const encrypted = payload.subarray(IV_LEN + TAG_LEN);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: TAG_LEN,
  });
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    "utf8"
  );
}

/**
 * Hash a value with SHA-256 (hex). Use for fingerprints / dedup keys.
 * Never use for passwords — use bcrypt/argon2 instead.
 */
export function hash(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

/**
 * Constant-time string comparison to prevent timing attacks.
 */
export function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Generate a cryptographically secure random token.
 */
export function generateToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString(ENCODING);
}

/** Encrypt a PAN number with its HKDF-derived key. */
export function encryptPAN(plaintext: string): string {
  return encryptWithKey(getPanKey(), plaintext);
}

/** Decrypt a PAN value produced by encryptPAN(). */
export function decryptPAN(ciphertext: string): string {
  return decryptWithKey(getPanKey(), ciphertext);
}

/** Encrypt a date of birth. Stored as ISO date string (YYYY-MM-DD). */
export function encryptDOB(date: Date): string {
  return encryptWithKey(deriveKey("pcfo-dob-v1"), date.toISOString().substring(0, 10));
}

/** Decrypt a DOB value produced by encryptDOB(). */
export function decryptDOB(ciphertext: string): Date {
  return new Date(decryptWithKey(deriveKey("pcfo-dob-v1"), ciphertext));
}

/** Encrypt a bank customer IDs map. */
export function encryptBankCustomerIds(ids: Record<string, string>): string {
  return encryptWithKey(deriveKey("pcfo-bank-cids-v1"), JSON.stringify(ids));
}

/** Decrypt a bank customer IDs map produced by encryptBankCustomerIds(). */
export function decryptBankCustomerIds(ciphertext: string): Record<string, string> {
  return JSON.parse(decryptWithKey(deriveKey("pcfo-bank-cids-v1"), ciphertext)) as Record<string, string>;
}

/** Encrypt a bank account numbers map. */
export function encryptBankAccountNos(accounts: Record<string, string>): string {
  return encryptWithKey(deriveKey("pcfo-bank-accts-v1"), JSON.stringify(accounts));
}

/** Decrypt a bank account numbers map produced by encryptBankAccountNos(). */
export function decryptBankAccountNos(ciphertext: string): Record<string, string> {
  return JSON.parse(decryptWithKey(deriveKey("pcfo-bank-accts-v1"), ciphertext)) as Record<string, string>;
}
