// Bank-specific PDF statement password formulas.
// Add a new entry to BANK_FORMULAS for each bank.
// generate() returns null if required profile fields are missing.

export interface UserProfile {
  name?: string | null;
  dateOfBirth?: Date | null;
  pan?: string | null;
  customerIds?: Record<string, string> | null;
  accountNumbers?: Record<string, string> | null;
}

interface BankPasswordFormula {
  bank: string;
  description: string;
  generate: (profile: UserProfile) => string | null;
}

// ── Helpers ───────────────────────────────────────────────────

function dobParts(dob: Date) {
  const dd   = String(dob.getDate()).padStart(2, "0");
  const mm   = String(dob.getMonth() + 1).padStart(2, "0");
  const yyyy = String(dob.getFullYear());
  const yy   = yyyy.slice(2);
  return { dd, mm, yyyy, yy };
}

// First N letters of name, ignoring spaces (uppercased)
function nameLetters(name: string, n: number): string {
  return name.replace(/\s+/g, "").toUpperCase().substring(0, n);
}

// ── Bank formulas ─────────────────────────────────────────────

const BANK_FORMULAS: BankPasswordFormula[] = [
  {
    bank: "ICICI",
    description: "First 4 letters of name (as on card) + DOB in DDMM",
    generate: ({ name, dateOfBirth }) => {
      if (!name || !dateOfBirth) return null;
      const { dd, mm } = dobParts(dateOfBirth);
      return `${nameLetters(name, 4)}${dd}${mm}`;
    },
  },
  {
    bank: "ICICI",
    description: "First 6 letters of name + DOB in DDMM",
    generate: ({ name, dateOfBirth }) => {
      if (!name || !dateOfBirth) return null;
      const { dd, mm } = dobParts(dateOfBirth);
      return `${nameLetters(name, 6)}${dd}${mm}`;
    },
  },
  {
    bank: "ICICI",
    description: "First 4 letters of first name only + DOB in DDMM",
    generate: ({ name, dateOfBirth }) => {
      if (!name || !dateOfBirth) return null;
      const firstName = name.trim().split(/\s+/)[0] ?? name;
      const { dd, mm } = dobParts(dateOfBirth);
      return `${nameLetters(firstName, 4)}${dd}${mm}`;
    },
  },
  {
    bank: "HDFC",
    description: "First 4 letters of name (embossed on card) + DOB in DDMM",
    generate: ({ name, dateOfBirth }) => {
      if (!name || !dateOfBirth) return null;
      const { dd, mm } = dobParts(dateOfBirth);
      return `${nameLetters(name, 4)}${dd}${mm}`;
    },
  },

  // ── Add more banks below as you share their formats ──────────
];

// ── Public API ────────────────────────────────────────────────

/** Returns all generated passwords from bank formulas for the given profile. */
export function generateBankPasswords(profile: UserProfile): string[] {
  const results: string[] = [];
  for (const formula of BANK_FORMULAS) {
    const pwd = formula.generate(profile);
    if (pwd) results.push(pwd);
  }
  return results;
}

/** Lists all supported banks and their password format description. */
export function listBankFormulas(): { bank: string; description: string }[] {
  return BANK_FORMULAS.map(({ bank, description }) => ({ bank, description }));
}
