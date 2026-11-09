import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const CATEGORIES = [
  { slug: "food", name: "Food & Dining", icon: "🍜", color: "#f97316", type: "expense", sortOrder: 1 },
  { slug: "groceries", name: "Groceries", icon: "🛒", color: "#84cc16", type: "expense", sortOrder: 2 },
  { slug: "fuel", name: "Fuel", icon: "⛽", color: "#eab308", type: "expense", sortOrder: 3 },
  { slug: "rent", name: "Rent", icon: "🏠", color: "#8b5cf6", type: "expense", sortOrder: 4 },
  { slug: "shopping", name: "Shopping", icon: "🛍️", color: "#ec4899", type: "expense", sortOrder: 5 },
  { slug: "utilities", name: "Utilities", icon: "⚡", color: "#06b6d4", type: "expense", sortOrder: 6 },
  { slug: "entertainment", name: "Entertainment", icon: "🎬", color: "#a855f7", type: "expense", sortOrder: 7 },
  { slug: "travel", name: "Travel", icon: "✈️", color: "#3b82f6", type: "expense", sortOrder: 8 },
  { slug: "investments", name: "Investments", icon: "📈", color: "#10b981", type: "expense", sortOrder: 9 },
  { slug: "healthcare", name: "Healthcare", icon: "🏥", color: "#ef4444", type: "expense", sortOrder: 10 },
  { slug: "emi", name: "EMI & Loans", icon: "🏦", color: "#6366f1", type: "expense", sortOrder: 11 },
  { slug: "subscriptions", name: "Subscriptions", icon: "📱", color: "#14b8a6", type: "expense", sortOrder: 12 },
  { slug: "salary", name: "Salary", icon: "💰", color: "#10b981", type: "income", sortOrder: 13 },
  { slug: "refunds", name: "Refunds", icon: "↩️", color: "#22c55e", type: "income", sortOrder: 14 },
  { slug: "wallet", name: "Wallet", icon: "👛", color: "#f59e0b", type: "both", sortOrder: 15 },
  { slug: "banking", name: "Banking", icon: "🏛️", color: "#6b7280", type: "both", sortOrder: 16 },
  { slug: "insurance", name: "Insurance", icon: "🛡️", color: "#7c3aed", type: "expense", sortOrder: 17 },
  { slug: "tax", name: "Tax", icon: "📋", color: "#94a3b8", type: "expense", sortOrder: 18 },
  { slug: "other", name: "Other", icon: "💳", color: "#6b7280", type: "both", sortOrder: 99 },
];

async function main() {
  console.log("Seeding categories...");

  for (const cat of CATEGORIES) {
    await db.category.upsert({
      where: { slug: cat.slug },
      create: cat,
      update: { name: cat.name, icon: cat.icon, color: cat.color },
    });
  }

  console.log(`Seeded ${CATEGORIES.length} categories.`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
