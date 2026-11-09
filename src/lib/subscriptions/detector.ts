// ============================================================
// Subscription Detection Engine
// Identifies recurring charges from transactions and emails
// ============================================================

export interface SubscriptionMeta {
  name: string;
  subcategory: string;
  icon: string;
  typicalPrices?: number[];  // common price points in INR
}

// ── Known subscription services ────────────────────────────
export const SUBSCRIPTION_CATALOG: Record<string, SubscriptionMeta> = {
  // Streaming Video
  netflix: { name: "Netflix", subcategory: "Streaming", icon: "🎬", typicalPrices: [149, 199, 499, 649, 799] },
  hotstar: { name: "Disney+ Hotstar", subcategory: "Streaming", icon: "📺", typicalPrices: [299, 499, 899, 1499] },
  "prime video": { name: "Amazon Prime Video", subcategory: "Streaming", icon: "📺" },
  "amazon prime": { name: "Amazon Prime", subcategory: "Ecommerce+Streaming", icon: "📦", typicalPrices: [299, 1499] },
  "jio cinema": { name: "JioCinema", subcategory: "Streaming", icon: "🎬" },
  "zee5": { name: "ZEE5", subcategory: "Streaming", icon: "📺", typicalPrices: [59, 365, 999] },
  "sonyliv": { name: "SonyLIV", subcategory: "Streaming", icon: "📺", typicalPrices: [299, 699, 999] },
  "mxplayer": { name: "MX Player Pro", subcategory: "Streaming", icon: "▶️" },
  "youtube premium": { name: "YouTube Premium", subcategory: "Streaming+Music", icon: "▶️", typicalPrices: [139, 189] },
  "apple tv": { name: "Apple TV+", subcategory: "Streaming", icon: "🍎", typicalPrices: [99, 199] },

  // Music
  spotify: { name: "Spotify", subcategory: "Music", icon: "🎵", typicalPrices: [7, 59, 119, 179] },
  "apple music": { name: "Apple Music", subcategory: "Music", icon: "🎵", typicalPrices: [99, 149, 299] },
  "amazon music": { name: "Amazon Music", subcategory: "Music", icon: "🎵" },
  "gaana": { name: "Gaana+", subcategory: "Music", icon: "🎵", typicalPrices: [13, 149] },
  "wynk": { name: "Wynk Music", subcategory: "Music", icon: "🎵" },
  "jiosaavn": { name: "JioSaavn Pro", subcategory: "Music", icon: "🎵", typicalPrices: [99, 299, 399] },

  // Food Delivery
  "swiggy one": { name: "Swiggy One", subcategory: "Food Delivery", icon: "🍔", typicalPrices: [89, 179, 259] },
  "zomato gold": { name: "Zomato Gold", subcategory: "Food Delivery", icon: "🍕", typicalPrices: [149, 299, 599] },
  "zomato pro": { name: "Zomato Pro", subcategory: "Food Delivery", icon: "🍕" },

  // Cloud Storage
  "google one": { name: "Google One", subcategory: "Cloud Storage", icon: "☁️", typicalPrices: [130, 210, 650] },
  "icloud": { name: "iCloud+", subcategory: "Cloud Storage", icon: "🍎", typicalPrices: [75, 219, 749] },
  "dropbox": { name: "Dropbox", subcategory: "Cloud Storage", icon: "☁️" },
  "onedrive": { name: "Microsoft 365", subcategory: "Productivity", icon: "📊" },

  // Productivity / SaaS
  "notion": { name: "Notion", subcategory: "Productivity", icon: "📝", typicalPrices: [800, 1600] },
  "figma": { name: "Figma", subcategory: "Design", icon: "🎨", typicalPrices: [1200, 2300] },
  "adobe": { name: "Adobe Creative Cloud", subcategory: "Design", icon: "🎨", typicalPrices: [1675, 4230] },
  "canva": { name: "Canva Pro", subcategory: "Design", icon: "🎨", typicalPrices: [499, 3999] },
  "slack": { name: "Slack", subcategory: "Communication", icon: "💬" },
  "zoom": { name: "Zoom", subcategory: "Communication", icon: "📹" },
  "github": { name: "GitHub", subcategory: "Developer", icon: "⚙️", typicalPrices: [320, 1600] },

  // AI Tools
  "chatgpt": { name: "ChatGPT Plus", subcategory: "AI Tools", icon: "🤖", typicalPrices: [1680] },
  "claude": { name: "Claude Pro", subcategory: "AI Tools", icon: "🤖", typicalPrices: [1680] },
  "midjourney": { name: "Midjourney", subcategory: "AI Tools", icon: "🎨", typicalPrices: [840, 2520, 4200] },
  "perplexity": { name: "Perplexity Pro", subcategory: "AI Tools", icon: "🤖", typicalPrices: [1680] },
  "copilot": { name: "GitHub Copilot", subcategory: "AI Tools", icon: "⚙️", typicalPrices: [840] },

  // Audiobooks / Learning
  "audible": { name: "Audible", subcategory: "Audiobooks", icon: "🎧", typicalPrices: [199, 399] },
  "kindle unlimited": { name: "Kindle Unlimited", subcategory: "Books", icon: "📚", typicalPrices: [169] },
  "coursera": { name: "Coursera", subcategory: "Learning", icon: "📚" },
  "udemy": { name: "Udemy", subcategory: "Learning", icon: "📚" },
  "duolingo": { name: "Duolingo Plus", subcategory: "Learning", icon: "🦆" },

  // Fitness
  "cult.fit": { name: "Cult.fit", subcategory: "Fitness", icon: "💪", typicalPrices: [799, 1499, 2499] },
  "healthifyme": { name: "HealthifyMe", subcategory: "Fitness", icon: "💪" },

  // News
  "the ken": { name: "The Ken", subcategory: "News", icon: "📰" },
  "the morning context": { name: "The Morning Context", subcategory: "News", icon: "📰" },
  "hindu": { name: "The Hindu Digital", subcategory: "News", icon: "📰", typicalPrices: [99, 299] },

  // Telecom
  "jio": { name: "Jio Recharge", subcategory: "Telecom", icon: "📱", typicalPrices: [239, 299, 666, 999] },
  "airtel": { name: "Airtel Recharge", subcategory: "Telecom", icon: "📱", typicalPrices: [299, 349, 666, 999] },
  "vi ": { name: "Vi Recharge", subcategory: "Telecom", icon: "📱" },
  "bsnl": { name: "BSNL Recharge", subcategory: "Telecom", icon: "📱" },

  // Insurance
  "policybazaar": { name: "PolicyBazaar Insurance", subcategory: "Insurance", icon: "🛡️" },
  "acko": { name: "Acko Insurance", subcategory: "Insurance", icon: "🛡️" },
  "niva bupa": { name: "Niva Bupa Health Insurance", subcategory: "Insurance", icon: "🛡️" },

  // Finance
  "smallcase": { name: "Smallcase", subcategory: "Investment", icon: "📈" },
  "zerodha": { name: "Zerodha", subcategory: "Investment", icon: "📈" },
  "groww": { name: "Groww", subcategory: "Investment", icon: "📈" },
};

// ── Subscription detection patterns ────────────────────────
export const SUBSCRIPTION_SUBJECT_PATTERNS = [
  /renewal (successful|confirmed|notice)/i,
  /subscription (renewed|active|payment|receipt|invoice)/i,
  /auto.?renew/i,
  /recurring (charge|payment|debit)/i,
  /membership (renewed|receipt|invoice)/i,
  /monthly (plan|subscription|billing)/i,
  /annual (plan|subscription|billing|renewal)/i,
  /your .* subscription/i,
  /invoice for .* subscription/i,
  /payment received.*subscription/i,
  /autopay (success|processed|mandate)/i,
  /mandate (registered|activated|successful)/i,
  /standing instruction/i,
  /trial (ending|expired|converted)/i,
  /free trial/i,
];

export const SUBSCRIPTION_BODY_KEYWORDS = [
  "subscription", "recurring", "renewal", "auto-renew", "autorenew",
  "billed monthly", "billed annually", "billed yearly",
  "monthly plan", "annual plan", "yearly plan",
  "next billing date", "next renewal date", "next charge",
  "membership fee", "membership renewed",
  "autopay", "auto-debit", "mandate",
  "standing instruction", "si registered",
  "you have been charged", "your payment was processed",
  "invoice", "receipt for",
];

// ── Mandate detection patterns ──────────────────────────────
export const MANDATE_PATTERNS = {
  upiRegistration: [
    /upi autopay (mandate|registration) (successful|activated|registered)/i,
    /autopay mandate.*(registered|activated)/i,
    /recurring mandate.*(created|registered)/i,
    /e.?mandate.*(registered|created|successful)/i,
    /standing instruction.*(registered|set up)/i,
  ],
  cardMandate: [
    /e.?mandate (registered|created|activated)/i,
    /auto.?pay registered.*(card|credit)/i,
    /recurring payment.*(registered|set up)/i,
    /tokenized payment/i,
    /nach mandate/i,
  ],
};

// ── Core detection functions ────────────────────────────────
export interface DetectionResult {
  isSubscription: boolean;
  confidence: number;
  merchantKey: string | null;
  meta: SubscriptionMeta | null;
  signals: string[];
}

export function detectSubscriptionFromMerchant(
  merchantName: string
): DetectionResult {
  const lower = merchantName.toLowerCase();
  const signals: string[] = [];

  for (const [key, meta] of Object.entries(SUBSCRIPTION_CATALOG)) {
    if (lower.includes(key)) {
      signals.push(`merchant match: ${key}`);
      return {
        isSubscription: true,
        confidence: 0.95,
        merchantKey: key,
        meta,
        signals,
      };
    }
  }

  return { isSubscription: false, confidence: 0, merchantKey: null, meta: null, signals };
}

export function detectSubscriptionFromSubject(subject: string): DetectionResult {
  const signals: string[] = [];

  for (const pattern of SUBSCRIPTION_SUBJECT_PATTERNS) {
    if (pattern.test(subject)) {
      signals.push(`subject pattern: ${pattern.source}`);
    }
  }

  if (signals.length > 0) {
    return {
      isSubscription: true,
      confidence: signals.length >= 2 ? 0.9 : 0.75,
      merchantKey: null,
      meta: null,
      signals,
    };
  }

  return { isSubscription: false, confidence: 0, merchantKey: null, meta: null, signals };
}

export function detectSubscriptionFromBody(body: string): DetectionResult {
  const lower = body.toLowerCase();
  const signals: string[] = [];

  for (const kw of SUBSCRIPTION_BODY_KEYWORDS) {
    if (lower.includes(kw)) {
      signals.push(`body keyword: ${kw}`);
    }
  }

  if (signals.length >= 2) {
    return {
      isSubscription: true,
      confidence: Math.min(0.85, 0.5 + signals.length * 0.08),
      merchantKey: null,
      meta: null,
      signals,
    };
  }

  return { isSubscription: false, confidence: 0, merchantKey: null, meta: null, signals };
}

export function lookupMerchantMeta(name: string): SubscriptionMeta | null {
  const lower = name.toLowerCase();
  for (const [key, meta] of Object.entries(SUBSCRIPTION_CATALOG)) {
    if (lower.includes(key)) return meta;
  }
  return null;
}

export function toMonthlyEquivalent(amount: number, freq: string): number {
  switch (freq) {
    case "WEEKLY": return amount * 4.33;
    case "QUARTERLY": return amount / 3;
    case "YEARLY": return amount / 12;
    default: return amount;
  }
}

export function toYearlyEquivalent(amount: number, freq: string): number {
  switch (freq) {
    case "DAILY": return amount * 365;
    case "WEEKLY": return amount * 52;
    case "QUARTERLY": return amount * 4;
    case "YEARLY": return amount;
    default: return amount * 12;
  }
}
