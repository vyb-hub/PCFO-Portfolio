"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { Shield, Lock, Eye, BrainCircuit } from "lucide-react";

function LoginContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    await signIn("google", { callbackUrl });
  };

  return (
    <div className="relative z-10 w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent-muted border border-accent-border mb-5">
          <BrainCircuit className="w-8 h-8 text-accent-light" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-gradient">PCFO</h1>
        <p className="text-ink-muted text-sm mt-1">
          Your private AI financial intelligence
        </p>
      </div>

      {/* Card */}
      <div className="glass-card p-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-ink">Sign in</h2>
          <p className="text-ink-muted text-sm mt-1">
            Access your private financial dashboard
          </p>
        </div>

        <button
          onClick={() => void handleGoogleLogin()}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl
                     bg-white/5 hover:bg-white/10 border border-glass-border hover:border-glass-hover
                     text-ink text-sm font-medium transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-ink-muted border-t-ink rounded-full animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          {loading ? "Connecting..." : "Continue with Google"}
        </button>

        {/* Security notice */}
        <div className="mt-6 pt-6 border-t border-glass-border">
          <div className="space-y-2.5">
            {[
              { icon: Lock, text: "Read-only Gmail access" },
              { icon: Shield, text: "End-to-end encrypted data" },
              { icon: Eye, text: "Single-user, private vault" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2.5 text-xs text-ink-muted">
                <Icon className="w-3.5 h-3.5 text-ink-faint flex-shrink-0" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-ink-faint mt-6">
        Your data never leaves your instance.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-accent/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[80px]" />
      </div>
      <Suspense fallback={
        <div className="relative z-10 w-full max-w-md text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      }>
        <LoginContent />
      </Suspense>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
