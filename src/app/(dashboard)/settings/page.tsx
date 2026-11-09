"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Shield, RefreshCw, Trash2, Download, Lock, UserCircle, Plus, X } from "lucide-react";
import Image from "next/image";

const BANKS = ["HDFC", "ICICI", "Axis", "SBI", "Kotak", "IndusInd", "IDFC", "Yes Bank", "PNB", "Canara"];

export default function SettingsPage() {
  const { data: session } = useSession();
  const [syncing, setSyncing] = useState(false);
  const [reprocessing, setReprocessing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  // Financial profile state
  const [profileName, setProfileName] = useState("");
  const [dob, setDob] = useState("");
  const [pan, setPan] = useState("");
  const [panSet, setPanSet] = useState(false);
  const [customerIds, setCustomerIds] = useState<Record<string, string>>({});
  const [accountNos, setAccountNos] = useState<Record<string, string>>({});
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((d: { name: string | null; dateOfBirth: string | null; panSet: boolean; bankCustomerIds: Record<string, string>; bankAccountNos: Record<string, string> }) => {
        // Fall back to Google session name if no profile name saved yet
        setProfileName(d.name ?? session?.user?.name ?? "");
        if (d.dateOfBirth) setDob(d.dateOfBirth);
        setPanSet(d.panSet);
        setCustomerIds(d.bankCustomerIds ?? {});
        setAccountNos(d.bankAccountNos ?? {});
      })
      .catch(() => null);
  }, [session?.user?.name]);

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileName || null,
          dateOfBirth: dob || null,
          pan: pan || null,
          bankCustomerIds: customerIds,
          bankAccountNos: accountNos,
        }),
      });
      setProfileMsg("Saved");
      if (pan) { setPanSet(true); setPan(""); }
    } catch {
      setProfileMsg("Failed to save");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleFullSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    const res = await fetch("/api/gmail/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full: true }),
    });
    const data = await res.json() as {
      success: boolean;
      data: {
        emailsFetched: number;
        emailsNew: number;
        emailsFinancial: number;
        transactionsCreated: number;
      };
    };
    setSyncing(false);
    if (data.success) {
      const d = data.data;
      setSyncResult(
        `Fetched ${d.emailsFetched} · ${d.emailsNew} new · ${d.emailsFinancial} financial · ${d.transactionsCreated} transactions created`
      );
    }
  };

  const handleReprocess = async () => {
    setReprocessing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/gmail/reprocess", { method: "POST" });
      const data = await res.json() as {
        success: boolean;
        emailsReclassified: number;
        emailsExtracted: number;
        transactionsCreated: number;
        error?: string;
      };
      if (data.success) {
        setSyncResult(
          `Reclassified ${data.emailsReclassified} emails · extracted from ${data.emailsExtracted} financial · ${data.transactionsCreated} transactions created`
        );
      } else {
        setSyncResult(`Error: ${data.error ?? "Unknown error"}`);
      }
    } catch (err) {
      setSyncResult(`Error: ${err instanceof Error ? err.message : "Request failed"}`);
    } finally {
      setReprocessing(false);
    }
  };

  return (
    <div className="px-6 py-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold text-ink mb-6">Settings</h1>

      {/* Profile */}
      <section className="glass-card p-5 mb-4">
        <h2 className="text-sm font-semibold text-ink mb-4">Profile</h2>
        <div className="flex items-center gap-4">
          {session?.user?.image && (
            <Image
              src={session.user.image}
              alt="Avatar"
              width={48}
              height={48}
              className="rounded-full border border-glass-border flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Your full name"
              className="w-full max-w-xs px-3 py-1.5 rounded-lg bg-white/5 border border-glass-border
                         text-sm font-medium text-ink placeholder:text-ink-faint
                         focus:outline-none focus:border-accent-border transition-colors mb-1"
            />
            <p className="text-sm text-ink-muted">{session?.user?.email}</p>
          </div>
          <button
            onClick={() => void handleSaveProfile()}
            disabled={profileSaving}
            className="px-3 py-1.5 rounded-lg bg-accent-muted hover:bg-accent/20 border border-accent-border
                       text-accent-light text-xs font-medium transition-all disabled:opacity-50 flex-shrink-0"
          >
            {profileSaving ? "Saving…" : "Save"}
          </button>
        </div>
        {profileMsg && (
          <p className={`text-xs mt-2 ${profileMsg === "Saved" ? "text-income" : "text-expense"}`}>{profileMsg}</p>
        )}
      </section>

      {/* Gmail Sync */}
      <section className="glass-card p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <RefreshCw className="w-4 h-4 text-accent-light" />
          <h2 className="text-sm font-semibold text-ink">Gmail Sync</h2>
        </div>
        <p className="text-sm text-ink-muted mb-4">
          Run a full historical sync to fetch emails from the last 90 days.
          Regular syncs run incrementally from your last sync point.
        </p>
        {syncResult && (
          <p className="text-xs text-income mb-3 bg-income-muted border border-income-border rounded-lg px-3 py-2">
            {syncResult}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => void fetch("/api/gmail/sync", { method: "POST" })}
            className="px-4 py-2 rounded-xl bg-accent-muted hover:bg-accent/20 border border-accent-border
                       text-accent-light text-sm font-medium transition-all"
          >
            Quick sync
          </button>
          <button
            onClick={() => void handleFullSync()}
            disabled={syncing || reprocessing}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-glass-border
                       text-ink-muted hover:text-ink text-sm font-medium transition-all
                       disabled:opacity-50"
          >
            {syncing ? "Syncing..." : "Full sync (90 days)"}
          </button>
          <button
            onClick={() => void handleReprocess()}
            disabled={syncing || reprocessing}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-glass-border
                       text-ink-muted hover:text-ink text-sm font-medium transition-all
                       disabled:opacity-50"
          >
            {reprocessing ? "Reprocessing..." : "Reprocess stored emails"}
          </button>
        </div>
      </section>

      {/* Security */}
      <section className="glass-card p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-accent-light" />
          <h2 className="text-sm font-semibold text-ink">Security</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ink">Two-Factor Authentication</p>
              <p className="text-xs text-ink-muted mt-0.5">TOTP authenticator app</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-lg ${
                (session?.user as { totpEnabled?: boolean })?.totpEnabled
                  ? "bg-income-muted text-income border border-income-border"
                  : "bg-warning-muted text-warning border border-warning/30"
              }`}>
                {(session?.user as { totpEnabled?: boolean })?.totpEnabled ? "Enabled" : "Disabled"}
              </span>
              <a
                href="/setup-mfa"
                className="text-xs text-accent-light hover:underline"
              >
                {(session?.user as { totpEnabled?: boolean })?.totpEnabled ? "Reconfigure" : "Enable"}
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-income bg-income-muted border border-income-border rounded-lg px-3 py-2">
            <Lock className="w-3.5 h-3.5" />
            Gmail access is read-only. PCFO cannot send, delete, or modify your emails.
          </div>
        </div>
      </section>

      {/* Financial Profile */}
      <section id="profile" className="glass-card p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <UserCircle className="w-4 h-4 text-accent-light" />
          <h2 className="text-sm font-semibold text-ink">Financial Profile</h2>
          <span className="text-xs text-ink-muted ml-1">Used to auto-unlock password-protected PDFs</span>
        </div>

        <div className="space-y-4">
          {/* DOB */}
          <div>
            <label className="text-xs text-ink-muted mb-1 block">Date of Birth</label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white/5 border border-glass-border text-sm text-ink
                         focus:outline-none focus:border-accent-border transition-colors w-48"
            />
            <p className="text-[10px] text-ink-faint mt-1">Tried as DDMMYYYY, DDMMYY, MMDDYYYY, YYYYMMDD</p>
          </div>

          {/* PAN */}
          <div>
            <label className="text-xs text-ink-muted mb-1 block">PAN Number</label>
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
                placeholder={panSet ? "••••••••••  (saved)" : "ABCDE1234F"}
                className="px-3 py-2 rounded-xl bg-white/5 border border-glass-border text-sm text-ink
                           placeholder:text-ink-faint focus:outline-none focus:border-accent-border
                           transition-colors w-48"
              />
              {panSet && (
                <button
                  onClick={() => { setPanSet(false); setPan(""); fetch("/api/user/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clearPAN: true }) }).catch(() => null); }}
                  className="text-xs text-expense hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Customer IDs */}
          <div>
            <label className="text-xs text-ink-muted mb-2 block">Bank Customer / CRN IDs</label>
            <div className="space-y-2">
              {Object.entries(customerIds).map(([bank, id]) => (
                <div key={bank} className="flex items-center gap-2">
                  <span className="text-xs text-ink w-20 flex-shrink-0">{bank}</span>
                  <input
                    value={id}
                    onChange={(e) => setCustomerIds((p) => ({ ...p, [bank]: e.target.value }))}
                    placeholder="Customer ID"
                    className="px-2 py-1.5 rounded-lg bg-white/5 border border-glass-border text-xs text-ink
                               focus:outline-none focus:border-accent-border transition-colors w-40"
                  />
                  <button onClick={() => setCustomerIds((p) => { const n = { ...p }; delete n[bank]; return n; })}>
                    <X className="w-3.5 h-3.5 text-ink-faint hover:text-expense" />
                  </button>
                </div>
              ))}
              <select
                onChange={(e) => { if (e.target.value) { setCustomerIds((p) => ({ ...p, [e.target.value]: "" })); e.target.value = ""; }}}
                className="px-2 py-1.5 rounded-lg bg-white/5 border border-glass-border text-xs text-ink-muted
                           focus:outline-none focus:border-accent-border transition-colors"
              >
                <option value="">+ Add bank</option>
                {BANKS.filter((b) => !customerIds[b]).map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>

          {/* Account Numbers */}
          <div>
            <label className="text-xs text-ink-muted mb-2 block">Bank Account Numbers</label>
            <div className="space-y-2">
              {Object.entries(accountNos).map(([bank, acc]) => (
                <div key={bank} className="flex items-center gap-2">
                  <span className="text-xs text-ink w-20 flex-shrink-0">{bank}</span>
                  <input
                    value={acc}
                    onChange={(e) => setAccountNos((p) => ({ ...p, [bank]: e.target.value }))}
                    placeholder="Account number"
                    className="px-2 py-1.5 rounded-lg bg-white/5 border border-glass-border text-xs text-ink
                               focus:outline-none focus:border-accent-border transition-colors w-40"
                  />
                  <button onClick={() => setAccountNos((p) => { const n = { ...p }; delete n[bank]; return n; })}>
                    <X className="w-3.5 h-3.5 text-ink-faint hover:text-expense" />
                  </button>
                </div>
              ))}
              <select
                onChange={(e) => { if (e.target.value) { setAccountNos((p) => ({ ...p, [e.target.value]: "" })); e.target.value = ""; }}}
                className="px-2 py-1.5 rounded-lg bg-white/5 border border-glass-border text-xs text-ink-muted
                           focus:outline-none focus:border-accent-border transition-colors"
              >
                <option value="">+ Add bank</option>
                {BANKS.filter((b) => !accountNos[b]).map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => void handleSaveProfile()}
              disabled={profileSaving}
              className="px-4 py-2 rounded-xl bg-accent-muted hover:bg-accent/20 border border-accent-border
                         text-accent-light text-sm font-medium transition-all disabled:opacity-50"
            >
              {profileSaving ? "Saving…" : "Save profile"}
            </button>
            {profileMsg && <span className={`text-xs ${profileMsg === "Saved" ? "text-income" : "text-expense"}`}>{profileMsg}</span>}
          </div>
        </div>
      </section>

      {/* Danger zone */}
      <section className="glass-card p-5 border border-expense-border/30">
        <div className="flex items-center gap-2 mb-4">
          <Trash2 className="w-4 h-4 text-expense" />
          <h2 className="text-sm font-semibold text-expense">Data Management</h2>
        </div>
        <p className="text-sm text-ink-muted mb-4">
          All data is stored locally in your database. You own it completely.
        </p>
        <div className="flex gap-3">
          <button className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-glass-border
                             text-ink-muted hover:text-ink text-sm font-medium transition-all
                             flex items-center gap-2">
            <Download className="w-3.5 h-3.5" />
            Export data
          </button>
        </div>
      </section>
    </div>
  );
}
