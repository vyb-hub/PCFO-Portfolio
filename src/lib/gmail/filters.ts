// ============================================================
// Finance Email Filters
// This is the gatekeeper. Non-finance emails never enter the pipeline.
// ============================================================

export const FINANCE_SENDER_DOMAINS = [
  // Indian Banks
  "hdfcbank.com",
  "icicibank.com",
  "axisbank.com",
  "sbi.co.in",
  "onlinesbi.com",
  "kotak.com",
  "yesbank.in",
  "indusind.com",
  "rblbank.com",
  "federalbank.co.in",
  "idfcfirstbank.com",
  "aubank.in",
  "dbs.com",
  "sc.com",
  "citi.com",
  "hsbc.co.in",
  "hdfcbank.net",
  // Payments & UPI
  "paytm.com",
  "phonepe.com",
  "googlepay.com",
  "razorpay.com",
  "cashfree.com",
  "payu.in",
  "billdesk.com",
  "npci.org.in",
  // Credit Cards
  "hdfcbank.com",
  "icicibank.com",
  "sbicard.com",
  "axisbank.com",
  "citi.com",
  "amex.com",
  "americanexpress.com",
  "bajajfinserv.in",
  // Wallets
  "mobikwik.com",
  "freecharge.in",
  "airtel.in",
  "jiomoney.com",
  // Investments
  "zerodha.com",
  "groww.in",
  "upstox.com",
  "angelone.in",
  "motilaloswal.com",
  "icicidirect.com",
  "hdfcsec.com",
  "kfintech.com",
  "camsonline.com",
  "mfuonline.com",
  "bseindia.com",
  "nseindia.com",
  // Insurance
  "licindia.in",
  "hdfclife.com",
  "iciciprulife.com",
  "bajajfinserv.in",
  "sbilife.co.in",
  "maxlifeinsurance.com",
  "starhealth.in",
  "niacl.org.in",
  "policybazaar.com",
  // Utilities & Subscriptions
  "netflix.com",
  "primevideo.com",
  "hotstar.com",
  "spotify.com",
  "apple.com",
  "google.com",
  "microsoft.com",
  "adobe.com",
  "notion.so",
  "github.com",
  "digitalocean.com",
  "aws.amazon.com",
  // E-commerce (for receipts)
  "amazon.in",
  "flipkart.com",
  "myntra.com",
  "ajio.com",
  "swiggy.com",
  "swiggy.in",
  "zomato.com",
  "zomato.in",
  "blinkit.com",
  "dunzo.com",
  "bigbasket.com",
  "zepto.com",
  "instamart.in",
  // Fuel & Transport
  "hpcl.in",
  "bpcl.in",
  "reliancebp.in",
  "ola.com",
  "uber.com",
  "rapido.bike",
  "irctc.co.in",
  "makemytrip.com",
  "goibibo.com",
  "airasia.com",
  "indigo.in",
  "airindia.in",
  // Tax & Compliance
  "incometax.gov.in",
  "gstn.org.in",
  "nsdl.co.in",
  "karvy.com",
];

export const FINANCE_SUBJECT_PATTERNS: RegExp[] = [
  // Transaction alerts
  /transaction\s*(alert|notification|successful|failed)/i,
  /debited|credited|debit\s*of|credit\s*of/i,
  /payment\s*(received|successful|failed|declined|confirmation)/i,
  /transfer\s*(successful|initiated|failed)/i,
  /amount\s*(debited|credited|transferred)/i,
  // Cards
  /credit\s*card\s*(statement|bill|due|payment|alert)/i,
  /card\s*(transaction|statement|bill|due|alert|blocked|unblocked)/i,
  /statement\s*(for|of)\s*(the\s*)?(month|period)/i,
  // UPI
  /upi\s*(transaction|payment|transfer|alert)/i,
  /upi\s*id|vpa\s*(debit|credit)/i,
  // Salary
  /salary\s*(credited|processed|paid|transfer)/i,
  /payroll\s*(processed|credit|transfer)/i,
  /ctc|compensation|hike|increment|bonus\s*credited/i,
  // EMI
  /emi\s*(reminder|due|payment|deduction|bounce|auto.?debit)/i,
  /loan\s*(emi|repayment|due|statement|disbursement)/i,
  // Investments
  /mutual\s*fund|sip\s*(deduction|executed|due)/i,
  /portfolio\s*(update|statement|report)/i,
  /stocks?|equity|dividend|redemption\s*successful/i,
  // Insurance
  /premium\s*(due|paid|receipt|reminder)/i,
  /policy\s*(renewal|premium|anniversary)/i,
  /insurance\s*(premium|renewal|receipt)/i,
  // Utility
  /electricity\s*(bill|payment|due)/i,
  /water\s*(bill|due|payment)/i,
  /gas\s*(bill|payment|due)/i,
  /broadband|internet\s*bill|recharge\s*(successful|receipt)/i,
  // Tax
  /income\s*tax\s*(refund|notice|filing|payment)/i,
  /tds\s*(deducted|certificate|credit)/i,
  /gst\s*(invoice|payment|return)/i,
  // Receipts & Invoices
  /order\s*(confirmed|placed|delivered|receipt)/i,
  /order\s+(?:was|has been)\s+(?:successfully\s+)?(delivered|confirmed|placed)/i,
  /invoice\s*(#|number|for|generated)/i,
  /receipt\s*(for|of|#)\s*(?:your\s*)?(?:order|payment|purchase)/i,
  /refund\s*(processed|initiated|successful)/i,
  // Subscriptions
  /subscription\s*(renewed|reminder|cancelled|expiring|receipt)/i,
  /renewal\s*(reminder|receipt|successful)/i,
  /auto.?renewal\s*(notice|successful)/i,
  // Bank generic
  /bank\s*(statement|notification|alert)/i,
  /account\s*(statement|balance|debit|credit)/i,
  /minimum\s*balance\s*alert/i,
  /cheque\s*(bounce|returned|issued|encashed)/i,
  /neft|rtgs|imps\s*(credit|debit|transfer)/i,
];

export const FINANCE_BODY_KEYWORDS = [
  "debited",
  "credited",
  "transaction",
  "payment",
  "amount",
  "balance",
  "account",
  "statement",
  "invoice",
  "receipt",
  "upi",
  "neft",
  "rtgs",
  "imps",
  "emi",
  "loan",
  "premium",
  "subscription",
  "refund",
  "salary",
  "credit card",
  "debit card",
  "mutual fund",
  "sip",
  "dividend",
  "tax",
  "gst",
  "insurance",
  "₹",
  "inr",
  "rs.",
  "rupees",
];

export const BLOCKED_SENDER_PATTERNS: RegExp[] = [
  /noreply@.*newsletter/i,
  /marketing@/i,
  /promotions@/i,
  /no-reply@social/i,
  /notifications@linkedin/i,
  /notifications@twitter/i,
  /notifications@instagram/i,
  /notifications@facebook/i,
];

export function isSenderFinancial(sender: string): boolean {
  const domain = extractDomain(sender);
  if (!domain) return false;
  return FINANCE_SENDER_DOMAINS.some(
    (d) => domain === d || domain.endsWith(`.${d}`)
  );
}

export function isSubjectFinancial(subject: string): boolean {
  return FINANCE_SUBJECT_PATTERNS.some((pattern) => pattern.test(subject));
}

export function isBlockedSender(sender: string): boolean {
  return BLOCKED_SENDER_PATTERNS.some((pattern) => pattern.test(sender));
}

export function bodyFinanceScore(body: string): number {
  const lower = body.toLowerCase();
  return FINANCE_BODY_KEYWORDS.filter((kw) => lower.includes(kw)).length;
}

function extractDomain(sender: string): string | null {
  const match = sender.match(/@([\w.-]+)/);
  return match?.[1]?.toLowerCase() ?? null;
}

/**
 * Quick pre-filter before AI classification.
 * Returns true if the email is *likely* financial.
 */
export function quickFinanceFilter(params: {
  sender: string;
  subject: string;
  snippet: string;
}): boolean {
  if (isBlockedSender(params.sender)) return false;
  if (isSenderFinancial(params.sender)) return true;
  // Forwarded emails — check the original subject after "Fwd:"
  const effectiveSubject = params.subject.replace(/^(fwd?:\s*)+/i, "").trim();
  if (isSubjectFinancial(effectiveSubject)) return true;
  if (isSubjectFinancial(params.subject)) return true;
  if (bodyFinanceScore(params.snippet) >= 2) return true;
  return false;
}

export const GMAIL_FINANCE_QUERY = [
  "NOT category:social",
  "(",
  [
    "transaction",
    "statement",
    "debited",
    "credited",
    "payment",
    "invoice",
    "receipt",
    "salary",
    "emi",
    "premium",
    "subscription",
    "refund",
    "upi",
    "neft",
    "rtgs",
    "mutual fund",
    "sip",
    "dividend",
    "income tax",
    "electricity bill",
    "credit card",
    "rs.",
    "₹",
  ]
    .map((kw) => `"${kw}"`)
    .join(" OR "),
  ")",
].join(" ");
