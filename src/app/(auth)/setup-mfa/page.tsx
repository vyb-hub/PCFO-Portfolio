"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, CheckCircle } from "lucide-react";
import Image from "next/image";

export default function SetupMFAPage() {
  const router = useRouter();
  const [step, setStep] = useState<"qr" | "verify" | "done">("qr");
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/totp/setup")
      .then((r) => r.json())
      .then((data: { success: boolean; data: { qrCode: string; secret: string } }) => {
        if (data.success) {
          setQrCode(data.data.qrCode);
          setSecret(data.data.secret);
        }
      })
      .catch(console.error);
  }, []);

  const handleVerify = async () => {
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/totp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    const data = await res.json() as { success: boolean; error?: string };
    setLoading(false);

    if (data.success) {
      setStep("done");
      setTimeout(() => router.push("/dashboard"), 2000);
    } else {
      setError(data.error ?? "Invalid code");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent-muted border border-accent-border mb-4">
            <Shield className="w-7 h-7 text-accent-light" />
          </div>
          <h1 className="text-2xl font-semibold text-ink">Secure your account</h1>
          <p className="text-ink-muted text-sm mt-1">
            Set up two-factor authentication
          </p>
        </div>

        <div className="glass-card p-7">
          {step === "done" ? (
            <div className="text-center py-6">
              <CheckCircle className="w-12 h-12 text-income mx-auto mb-3" />
              <p className="text-ink font-medium">MFA enabled successfully</p>
              <p className="text-ink-muted text-sm mt-1">Redirecting to dashboard...</p>
            </div>
          ) : step === "qr" ? (
            <>
              <p className="text-sm text-ink-muted mb-5">
                Scan this QR code with your authenticator app (Google Authenticator,
                Authy, or 1Password).
              </p>
              {qrCode ? (
                <div className="flex justify-center mb-5">
                  <div className="p-3 bg-white rounded-xl">
                    <Image src={qrCode} alt="TOTP QR Code" width={180} height={180} />
                  </div>
                </div>
              ) : (
                <div className="w-[180px] h-[180px] skeleton mx-auto mb-5 rounded-xl" />
              )}
              {secret && (
                <div className="bg-surface/50 border border-glass-border rounded-lg p-3 mb-5">
                  <p className="text-xs text-ink-muted mb-1">Manual entry key</p>
                  <code className="text-xs text-ink font-mono break-all">{secret}</code>
                </div>
              )}
              <button
                onClick={() => setStep("verify")}
                className="w-full py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-white text-sm font-medium transition-colors"
              >
                I&apos;ve scanned the QR code
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-ink-muted mb-5">
                Enter the 6-digit code from your authenticator app to confirm setup.
              </p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full px-4 py-3 rounded-xl bg-surface/50 border border-glass-border
                           text-ink text-center text-2xl tracking-[0.5em] font-mono
                           focus:outline-none focus:border-accent/50 transition-colors mb-4"
              />
              {error && <p className="text-expense text-sm mb-3">{error}</p>}
              <button
                onClick={handleVerify}
                disabled={token.length !== 6 || loading}
                className="w-full py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-white text-sm font-medium
                           transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying..." : "Verify & Enable MFA"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
