import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", ...fontFamily.sans],
        mono: ["var(--font-geist-mono)", ...fontFamily.mono],
      },
      colors: {
        // Base surfaces — Ocean Glass
        void: "#030c10",
        surface: {
          DEFAULT: "#040e16",
          1: "#071420",
          2: "#0a1a28",
          3: "#0d2030",
        },
        // Brand accent — Teal (Ocean Glass)
        accent: {
          DEFAULT: "#2dd4bf",
          light: "#5eead4",
          muted: "rgba(45,212,191,0.11)",
          border: "rgba(45,212,191,0.26)",
        },
        // Semantic
        income: {
          DEFAULT: "#4ade80",
          muted: "rgba(74,222,128,0.10)",
          border: "rgba(74,222,128,0.28)",
        },
        expense: {
          DEFAULT: "#f87171",
          muted: "rgba(248,113,113,0.10)",
          border: "rgba(248,113,113,0.28)",
        },
        warning: {
          DEFAULT: "#fbbf24",
          muted: "rgba(251,191,36,0.10)",
        },
        // Text
        ink: {
          DEFAULT: "rgba(255,255,255,0.93)",
          muted: "rgba(255,255,255,0.52)",
          faint: "rgba(255,255,255,0.26)",
        },
        // Glass borders
        glass: {
          border: "rgba(255,255,255,0.09)",
          hover:  "rgba(255,255,255,0.16)",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-glow":
          "radial-gradient(ellipse at 50% 0%, rgba(45,212,191,0.12) 0%, transparent 60%)",
        "card-gradient":
          "linear-gradient(150deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.028) 60%, rgba(255,255,255,0.018) 100%)",
      },
      boxShadow: {
        glass:
          "0 2px 6px rgba(0,0,0,0.28), 0 8px 36px rgba(0,0,0,0.45), 0 24px 64px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(0,0,0,0.10)",
        "glass-hover":
          "0 2px 6px rgba(0,0,0,0.30), 0 18px 56px rgba(0,0,0,0.55), 0 32px 80px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.12)",
        glow:    "0 0 48px rgba(45,212,191,0.25)",
        income:  "0 0 24px rgba(74,222,128,0.22)",
        expense: "0 0 24px rgba(248,113,113,0.22)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "pulse-subtle": "pulseSubtle 3s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "1.75rem",
        "5xl": "2rem",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
