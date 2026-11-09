"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  CreditCard,
  BarChart3,
  Lightbulb,
  Repeat2,
  Target,
  Settings,
  LogOut,
  BrainCircuit,
  RefreshCw,
  Activity,
  Crosshair,
  FileUp,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/transactions", icon: CreditCard, label: "Transactions" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/insights", icon: Lightbulb, label: "Insights" },
  { href: "/behavioral", icon: Activity, label: "Behavioral", badge: "🍺🚬⛽" },
  { href: "/mission", icon: Crosshair, label: "Mission", badge: "🎯" },
  { href: "/subscriptions", icon: Repeat2, label: "Subscriptions" },
  { href: "/budgets", icon: Target, label: "Budgets" },
  { href: "/analyzer", icon: FileUp, label: "Statements" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [syncing, setSyncing] = useState(false);
  const { theme, setTheme } = useTheme();

  const ThemeIcon = theme === "light" ? Sun : Moon;
  const themeLabel = theme === "light" ? "Light" : "Dark";

  const handleSync = async () => {
    setSyncing(true);
    await fetch("/api/gmail/sync", { method: "POST" });
    setSyncing(false);
    window.location.reload();
  };

  return (
    <aside className="flex flex-col h-full w-60 py-5 px-3 border-r border-glass-border bg-surface/20 backdrop-blur-2xl" style={{ backdropFilter: "blur(40px) saturate(180%)" }}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 mb-8">
        <div className="w-8 h-8 rounded-2xl bg-accent-muted border border-accent-border flex items-center justify-center" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)" }}>
          <BrainCircuit className="w-4 h-4 text-accent-light" />
        </div>
        <span className="font-semibold text-ink tracking-tight">PCFO</span>
      </div>

      {/* Sync button */}
      <button
        onClick={handleSync}
        disabled={syncing}
        className="flex items-center gap-2 mx-2 mb-5 px-3 py-2
                   bg-accent-muted hover:bg-accent/20 border border-accent-border
                   text-accent-light text-xs font-medium transition-all
                   disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ borderRadius: "999px", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10)" }}
      >
        <RefreshCw className={cn("w-3.5 h-3.5", syncing && "animate-spin")} />
        {syncing ? "Syncing..." : "Sync Gmail"}
      </button>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5">
        {NAV_ITEMS.map(({ href, icon: Icon, label, badge }) => (
          <Link
            key={href}
            href={href}
            className={cn("nav-item", pathname === href && "active")}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
            {badge && (
              <span className="ml-auto text-[10px] opacity-60 tracking-tight">{badge}</span>
            )}
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-glass-border pt-4 space-y-1">
        <Link
          href="/settings"
          className={cn("nav-item", pathname === "/settings" && "active")}
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="nav-item w-full"
        >
          <ThemeIcon className="w-4 h-4 flex-shrink-0" />
          <span>{themeLabel}</span>
        </button>

        {/* User info */}
        {session?.user && (
          <div className="px-3 py-2 flex items-center gap-2.5">
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt="Avatar"
                width={28}
                height={28}
                className="rounded-full border border-glass-border"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-accent-muted border border-accent-border" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-ink font-medium truncate">
                {session.user.name ?? "User"}
              </p>
              <p className="text-[10px] text-ink-faint truncate">
                {session.user.email}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="nav-item w-full text-expense hover:text-expense hover:bg-expense-muted"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
