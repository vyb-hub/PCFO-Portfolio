// ============================================================
// Vice & Habit Detection Engine
// Identifies alcohol, cigarette, and fuel transactions
// from email text and transaction metadata.
// Zero moralizing — pure pattern recognition.
// ============================================================

export type ViceType = "ALCOHOL" | "CIGARETTES" | "FUEL";

export interface ViceMatch {
  type: ViceType;
  confidence: number;
  merchant?: string;
  quantity?: number;      // packs, units, litres
  detectedKeyword: string;
}

// ── Alcohol Detection ─────────────────────────────────────────

const ALCOHOL_MERCHANTS = [
  "ksbc",
  "kerala state beverages",
  "bevco",
  "beverage corporation",
  "kerala beverages",
  "ksbc outlet",
];

const ALCOHOL_KEYWORDS = [
  "ksbc",
  "bevco",
  "kerala state beverages",
  "beverage corporation",
  "liquor",
  "spirits",
  "wine shop",
  "beer shop",
];

export function detectAlcohol(
  merchant: string,
  description: string,
  body: string
): ViceMatch | null {
  const hay = [merchant, description, body].join(" ").toLowerCase();

  for (const kw of ALCOHOL_MERCHANTS) {
    if (hay.includes(kw)) {
      return {
        type: "ALCOHOL",
        confidence: 0.97,
        merchant: normalizeMerchant(merchant, "KSBC"),
        detectedKeyword: kw,
      };
    }
  }

  for (const kw of ALCOHOL_KEYWORDS) {
    if (hay.includes(kw)) {
      return {
        type: "ALCOHOL",
        confidence: 0.8,
        merchant: normalizeMerchant(merchant, "Liquor Store"),
        detectedKeyword: kw,
      };
    }
  }

  return null;
}

// ── Cigarette Detection ───────────────────────────────────────

// Looks inside Swiggy/Blinkit order item lists for specific SKUs.
// This is item-level parsing, not merchant-level.
const CIGARETTE_SKUS = [
  "goldflake lights",
  "gold flake lights",
  "goldflake premium",
  "goldflake kings",
  "gold flake kings",
  "gold flake premium",
  "goldflake",
  "gold flake",
  "classic milds",
  "classic regular",
  "wills navy cut",
  "four square",
  "red & white",
  "insignia",
  "marlboro",
  "dunhill",
  "parliament",
  "newport",
  "cigarettes",
  "cigarette",
];

const DELIVERY_PLATFORMS = ["swiggy", "blinkit", "zepto", "instamart", "dunzo"];

// Short keywords found in UPI remarks for cash/offline cigarette purchases
const CIGARETTE_UPI_REMARKS = [
  "cig",
  "cigg",
  "cigarette",
  "cigarettes",
  "smokes",
  "smoke",
  "beedi",
  "bidi",
  "paan",
];

export function detectCigarettes(
  sender: string,
  merchant: string,
  body: string,
  upiRemarks?: string
): ViceMatch | null {
  const hay = body.toLowerCase();
  const senderLower = [sender, merchant].join(" ").toLowerCase();

  // UPI remarks path — catches cash/offline purchases
  if (upiRemarks) {
    const remarksLower = upiRemarks.toLowerCase();
    for (const kw of CIGARETTE_UPI_REMARKS) {
      if (remarksLower.includes(kw)) {
        return {
          type: "CIGARETTES",
          confidence: 0.88,
          merchant: merchant || "Local Shop",
          detectedKeyword: kw,
        };
      }
    }
  }

  // Delivery platform path — item-level SKU matching
  const isDelivery = DELIVERY_PLATFORMS.some((p) => senderLower.includes(p));
  if (!isDelivery) return null;

  for (const sku of CIGARETTE_SKUS) {
    if (hay.includes(sku)) {
      const qty = extractCigaretteQuantity(hay, sku);
      return {
        type: "CIGARETTES",
        confidence: 0.95,
        merchant: normalizePlatform(senderLower),
        quantity: qty,
        detectedKeyword: sku,
      };
    }
  }

  return null;
}

function extractCigaretteQuantity(body: string, sku: string): number | undefined {
  // Look for patterns like "2x Goldflake Lights" or "Goldflake Lights x 2"
  const idx = body.indexOf(sku);
  if (idx < 0) return undefined;

  const context = body.substring(Math.max(0, idx - 15), idx + sku.length + 15);
  const match = context.match(/(\d+)\s*[x×]/i) ?? context.match(/[x×]\s*(\d+)/i);
  return match ? parseInt(match[1]!, 10) : 1;
}

// ── Fuel Detection ────────────────────────────────────────────

const FUEL_MERCHANTS = [
  "reliance jio bp",
  "jio bp",
  "jio-bp",
  "jiobp",
  "bpcl",
  "bharat petroleum",
  "bharath petroleum",
  "indian oil",
  "iocl",
  "hp petrol",
  "hpcl",
  "hindustan petroleum",
  "essar",
  "shell",
  "nayara energy",
];

const FUEL_KEYWORDS = [
  "petrol",
  "diesel",
  "fuel",
  "cng",
  "ev charging",
  "ev charge",
];

export function detectFuel(
  merchant: string,
  description: string,
  body: string
): ViceMatch | null {
  const hay = [merchant, description].join(" ").toLowerCase();

  for (const kw of FUEL_MERCHANTS) {
    if (hay.includes(kw)) {
      return {
        type: "FUEL",
        confidence: 0.97,
        merchant: normalizeFuelMerchant(merchant),
        detectedKeyword: kw,
      };
    }
  }

  // Keyword fallback (lower confidence — "petrol" can appear in other contexts)
  const fullHay = [merchant, description, body.substring(0, 200)].join(" ").toLowerCase();
  for (const kw of FUEL_KEYWORDS) {
    if (fullHay.includes(kw)) {
      return {
        type: "FUEL",
        confidence: 0.72,
        merchant: normalizeMerchant(merchant, "Fuel Station"),
        detectedKeyword: kw,
      };
    }
  }

  return null;
}

// ── Behavioral metadata ───────────────────────────────────────

export interface BehaviorMeta {
  isWeekend: boolean;         // Sat or Sun
  isLateNight: boolean;       // 22:00 – 04:00
  isPreSalary: boolean;       // within 5 days BEFORE salary credit
  isPostSalary: boolean;      // within 3 days AFTER salary credit
  dayOfWeek: number;          // 0=Sun … 6=Sat
  hourOfDay: number;
}

export function extractBehaviorMeta(
  date: Date,
  salaryDate?: Date
): BehaviorMeta {
  const dow = date.getDay();
  const hour = date.getHours();

  return {
    isWeekend: dow === 0 || dow === 6,
    isLateNight: hour >= 22 || hour <= 4,
    isPreSalary: salaryDate
      ? daysBetween(date, salaryDate) <= 5 && date < salaryDate
      : false,
    isPostSalary: salaryDate
      ? daysBetween(date, salaryDate) <= 3 && date >= salaryDate
      : false,
    dayOfWeek: dow,
    hourOfDay: hour,
  };
}

function daysBetween(a: Date, b: Date): number {
  return Math.abs(Math.round((a.getTime() - b.getTime()) / 86_400_000));
}

// ── Run all detectors ─────────────────────────────────────────

export function detectVice(params: {
  merchant: string;
  description: string;
  sender: string;
  body: string;
  upiRemarks?: string;
}): ViceMatch | null {
  return (
    detectAlcohol(params.merchant, params.description, params.body) ??
    detectCigarettes(params.sender, params.merchant, params.body, params.upiRemarks) ??
    detectFuel(params.merchant, params.description, params.body)
  );
}

// ── Normalizers ───────────────────────────────────────────────

function normalizeMerchant(raw: string, fallback: string): string {
  return raw.trim() || fallback;
}

function normalizeFuelMerchant(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("jio") || lower.includes("reliance")) return "Jio BP";
  if (lower.includes("bpcl") || lower.includes("bharat")) return "BPCL";
  if (lower.includes("iocl") || lower.includes("indian oil")) return "Indian Oil";
  if (lower.includes("hp") || lower.includes("hindustan")) return "HP Petrol";
  return raw.trim() || "Fuel Station";
}

function normalizePlatform(lower: string): string {
  if (lower.includes("swiggy")) return "Swiggy";
  if (lower.includes("blinkit")) return "Blinkit";
  if (lower.includes("zepto")) return "Zepto";
  return "Delivery";
}
