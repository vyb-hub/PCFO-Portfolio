import type { Session } from "next-auth";

// ── Re-export Prisma enums as local types ─────────────────────
export type TransactionType = "DEBIT" | "CREDIT" | "TRANSFER" | "REFUND";
export type InsightType =
  | "SPENDING_SPIKE"
  | "BUDGET_WARNING"
  | "BUDGET_EXCEEDED"
  | "SUBSCRIPTION_INACTIVE"
  | "SUBSCRIPTION_CREEP"
  | "SALARY_RECEIVED"
  | "UNUSUAL_TRANSACTION"
  | "SAVINGS_MILESTONE"
  | "EMI_REMINDER"
  | "BEHAVIORAL_PATTERN"
  | "DAILY_DIGEST"
  | "WEEKLY_SUMMARY"
  | "MONTHLY_REPORT";

export type InsightSeverity = "INFO" | "SUCCESS" | "WARNING" | "ALERT";

// ── Authenticated session extension ───────────────────────────
export interface AuthSession extends Session {
  user: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    totpEnabled: boolean;
    mfaVerified?: boolean;
  };
}

// ── Analytics DTOs ────────────────────────────────────────────
export interface MonthlySummary {
  month: string;          // "2024-11"
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  savingsRate: number;    // 0.0 – 1.0
  burnRate: number;       // daily avg expense
  transactionCount: number;
}

export interface CategoryBreakdown {
  category: string;
  displayName: string;
  icon: string;
  color: string;
  amount: number;
  percentage: number;
  transactionCount: number;
  trend: number;          // % change vs prior period
}

export interface SpendingTrend {
  date: string;
  income: number;
  expenses: number;
  net: number;
}

export interface DashboardData {
  summary: MonthlySummary;
  categoryBreakdown: CategoryBreakdown[];
  spendingTrend: SpendingTrend[];
  recentTransactions: TransactionDTO[];
  topInsights: InsightDTO[];
  upcomingEMIs: SubscriptionDTO[];
  syncStatus: SyncStatus;
}

// ── Transaction DTO ───────────────────────────────────────────
export interface TransactionDTO {
  id: string;
  amount: number;
  currency: string;
  type: TransactionType;
  category: string;
  categoryDisplay: string;
  categoryIcon: string;
  categoryColor: string;
  description: string;
  merchant?: string;
  account?: string;
  accountLast4?: string;
  date: string;
  isRecurring: boolean;
  confidence?: number;
}

// ── Insight DTO ───────────────────────────────────────────────
export interface InsightDTO {
  id: string;
  type: InsightType;
  title: string;
  body: string;
  severity: InsightSeverity;
  period?: string;
  createdAt: string;
}

// ── Subscription DTO ─────────────────────────────────────────
export interface SubscriptionDTO {
  id: string;
  name: string;
  amount: number;
  currency: string;
  frequency: string;
  nextDueDate?: string;
  lastChargedAt?: string;
  isActive: boolean;
  category: string;
  monthlyEquivalent: number;
}

// ── Sync Status ───────────────────────────────────────────────
export interface SyncStatus {
  lastSyncAt: string | null;
  emailsProcessed: number;
  transactionsExtracted: number;
  isRunning: boolean;
  error?: string;
}

// ── Extracted Transaction (from AI) ──────────────────────────
export interface ExtractedTransaction {
  amount: number;
  currency: string;
  type: TransactionType;
  description: string;
  merchant?: string;
  account?: string;
  accountLast4?: string;
  referenceId?: string;
  date: string;
  category: string;
  confidence: number;
  rawText: string;
}

// ── API Response wrapper ──────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: Record<string, unknown>;
}

// ── Pagination ────────────────────────────────────────────────
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
