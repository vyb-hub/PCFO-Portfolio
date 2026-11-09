"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Shield, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";

function VerifyMFAContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update } = useSession();
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  // Focus first empty input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const code = digits.join("");

  const handleDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError("");

    // Auto-advance
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (digit && index === 5 && next.every((d) => d !== "")) {
      void submit(next.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter" && code.length === 6) {
      void submit(code);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 0) return;
    const next = pasted.split("").concat(Array(6).fill("")).slice(0, 6);
    setDigits(next);
    const lastFilled = Math.min(pasted.length, 5);
    inputRefs.current[lastFilled]?.focus();
    if (pasted.length === 6) void submit(pasted);
  };

  const submit = async (token: string) => {
    if (token.length !== 6) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/totp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json() as { success: boolean; error?: string };

      if (!data.success) {
        setError(data.error ?? "Invalid code. Try again.");
        setDigits(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        setLoading(false);
        return;
      }

      // Update JWT to mark MFA as verified in this session
      await update({ mfaVerified: true });
      router.replace(callbackUrl);
    } catch {
      setError("Connection error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl
                          bg-accent-muted border border-accent-border mb-4">
            <Shield className="w-7 h-7 text-accent-light" />
          </div>
          <h1 className="text-2xl font-semibold text-ink">Two-factor authentication</h1>
          <p className="text-ink-muted text-sm mt-1.5">
            Enter the 6-digit code from your authenticator app
          </p>
        </div>

        <div className="glass-card p-7 space-y-6">
          {/* OTP input grid */}
          <div className="flex gap-2.5 justify-center" onPaste={handlePaste}>
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigit(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                disabled={loading}
                className={cn(
                  "w-11 h-14 rounded-xl text-center text-2xl font-mono font-semibold",
                  "bg-surface/50 border text-ink",
                  "focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all",
                  "disabled:opacity-50",
                  digit
                    ? "border-accent/50 bg-accent/5"
                    : "border-glass-border",
                  error && "border-expense/50 bg-expense/5"
                )}
              />
            ))}
          </div>

          {/* Error */}
          {error && (
            <p className="text-expense text-sm text-center -mt-2">{error}</p>
          )}

          {/* Submit button */}
          <button
            onClick={() => void submit(code)}
            disabled={code.length !== 6 || loading}
            className="w-full py-3 rounded-xl bg-accent hover:bg-accent/90 text-white
                       text-sm font-medium transition-all
                       disabled:opacity-40 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Verifying…
              </>
            ) : (
              "Verify"
            )}
          </button>

          <p className="text-center text-xs text-ink-faint">
            Open your authenticator app to find your PCFO code.
            Codes refresh every 30 seconds.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyMFAPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <VerifyMFAContent />
    </Suspense>
  );
}
