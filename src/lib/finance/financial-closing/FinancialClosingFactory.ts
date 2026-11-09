import type { PrismaClient } from "@prisma/client";
import { createDefaultRepositories } from "../../infrastructure/repositories/index";
import { PrismaFinancialMonthRepository } from "../../infrastructure/repositories/PrismaFinancialMonthRepository";
import { PrismaStatementRequirementRepository } from "../../infrastructure/repositories/PrismaStatementRequirementRepository";
import { createDefaultFinancialStateService } from "../pipeline";
import { NullConversationResponder, type ConversationDeliveryService } from "../conversation";
import { ClosingConversationEventMapper } from "./ClosingConversationEventMapper";
import { FinancialClosingNotifier } from "./FinancialClosingNotifier";
import { FinancialMonthClosingService } from "./FinancialMonthClosingService";

/**
 * Sole wiring point for the Monthly Closing Service — mirrors
 * PipelineFactory.ts's composition pattern. `conversationDelivery` is
 * constructed by the caller (route boundary reads TELEGRAM_* env vars via
 * createDefaultTelegramDelivery()) and passed in null when not configured;
 * this factory never reads process.env itself.
 */
export function createDefaultFinancialMonthClosingService(
  db: PrismaClient,
  conversationDelivery: ConversationDeliveryService | null,
): FinancialMonthClosingService {
  const repos = createDefaultRepositories(db);
  const monthRepo = new PrismaFinancialMonthRepository(db);
  const requirementRepo = new PrismaStatementRequirementRepository(db);
  const stateService = createDefaultFinancialStateService(db);
  const notifier = new FinancialClosingNotifier(
    new ClosingConversationEventMapper(),
    new NullConversationResponder(),
    conversationDelivery,
  );

  return new FinancialMonthClosingService(monthRepo, requirementRepo, repos.debts, stateService, notifier);
}
