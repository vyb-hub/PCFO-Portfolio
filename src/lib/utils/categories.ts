export interface CategoryMeta {
  name: string;
  icon: string;
  color: string;
  type: "income" | "expense" | "both";
}

export const CATEGORY_META: Record<string, CategoryMeta> = {
  food: { name: "Food & Dining", icon: "🍜", color: "#f97316", type: "expense" },
  groceries: { name: "Groceries", icon: "🛒", color: "#84cc16", type: "expense" },
  fuel: { name: "Fuel", icon: "⛽", color: "#eab308", type: "expense" },
  rent: { name: "Rent", icon: "🏠", color: "#8b5cf6", type: "expense" },
  shopping: { name: "Shopping", icon: "🛍️", color: "#ec4899", type: "expense" },
  utilities: { name: "Utilities", icon: "⚡", color: "#06b6d4", type: "expense" },
  entertainment: { name: "Entertainment", icon: "🎬", color: "#a855f7", type: "expense" },
  travel: { name: "Travel", icon: "✈️", color: "#3b82f6", type: "expense" },
  investments: { name: "Investments", icon: "📈", color: "#10b981", type: "expense" },
  healthcare: { name: "Healthcare", icon: "🏥", color: "#ef4444", type: "expense" },
  emi: { name: "EMI & Loans", icon: "🏦", color: "#6366f1", type: "expense" },
  subscriptions: { name: "Subscriptions", icon: "📱", color: "#14b8a6", type: "expense" },
  salary: { name: "Salary", icon: "💰", color: "#10b981", type: "income" },
  refunds: { name: "Refunds", icon: "↩️", color: "#22c55e", type: "income" },
  wallet: { name: "Wallet", icon: "👛", color: "#f59e0b", type: "both" },
  banking: { name: "Banking", icon: "🏛️", color: "#6b7280", type: "both" },
  insurance: { name: "Insurance", icon: "🛡️", color: "#7c3aed", type: "expense" },
  tax: { name: "Tax", icon: "📋", color: "#94a3b8", type: "expense" },
  // ── Vice categories ───────────────────────────────────────
  alcohol: { name: "Alcohol", icon: "🍺", color: "#f59e0b", type: "expense" },
  booze: { name: "Alcohol", icon: "🍺", color: "#f59e0b", type: "expense" },
  cigarettes: { name: "Cigarettes", icon: "🚬", color: "#9ca3af", type: "expense" },
  smoking: { name: "Cigarettes", icon: "🚬", color: "#9ca3af", type: "expense" },

  other: { name: "Other", icon: "💳", color: "#6b7280", type: "both" },
};

export const EXPENSE_CATEGORIES = Object.entries(CATEGORY_META)
  .filter(([, v]) => v.type === "expense" || v.type === "both")
  .map(([k]) => k);

export const INCOME_CATEGORIES = Object.entries(CATEGORY_META)
  .filter(([, v]) => v.type === "income" || v.type === "both")
  .map(([k]) => k);

export function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
