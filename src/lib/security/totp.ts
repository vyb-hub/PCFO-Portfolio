import { authenticator } from "otplib";
import * as QRCode from "qrcode";
import { encrypt, decrypt } from "@/lib/crypto/encryption";

const APP_NAME = "PCFO";

authenticator.options = {
  window: 1,     // Allow ±30s clock drift
  digits: 6,
  step: 30,
};

export function generateTOTPSecret(): string {
  return authenticator.generateSecret(20);
}

export function generateTOTPUri(secret: string, email: string): string {
  return authenticator.keyuri(email, APP_NAME, secret);
}

export async function generateQRCode(uri: string): Promise<string> {
  return QRCode.toDataURL(uri, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 200,
    color: { dark: "#e8e8ff", light: "#0a0a1a" },
  });
}

export function verifyTOTP(token: string, encryptedSecret: string): boolean {
  try {
    const secret = decrypt(encryptedSecret);
    return authenticator.verify({ token, secret });
  } catch {
    return false;
  }
}

export function encryptSecret(secret: string): string {
  return encrypt(secret);
}

export function generateBackupCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = Math.random().toString(36).substring(2, 6).toUpperCase() +
                 "-" +
                 Math.random().toString(36).substring(2, 6).toUpperCase();
    codes.push(code);
  }
  return codes;
}
