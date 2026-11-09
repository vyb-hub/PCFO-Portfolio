import { describe, it, expect } from "vitest";
import {
  createDefaultFinancialInsightEngine,
  createDefaultFinancialInsightService,
} from "../generators/financialInsightFactory";
import { FinancialInsightGeneratorType } from "../FinancialInsightGeneratorType";

describe("createDefaultFinancialInsightEngine", () => {
  it("returns a valid engine with 10 registered generators", () => {
    const engine = createDefaultFinancialInsightEngine();
    const registered = engine.registeredGenerators();
    expect(registered).toHaveLength(10);
  });

  it("includes all required generator types", () => {
    const engine = createDefaultFinancialInsightEngine();
    const registered = new Set(engine.registeredGenerators());
    const required = [
      FinancialInsightGeneratorType.SAVINGS,
      FinancialInsightGeneratorType.CASH_FLOW,
      FinancialInsightGeneratorType.DEBT,
      FinancialInsightGeneratorType.DEBT_TO_INCOME,
      FinancialInsightGeneratorType.CREDIT,
      FinancialInsightGeneratorType.SPENDING,
      FinancialInsightGeneratorType.INVESTMENTS,
      FinancialInsightGeneratorType.EMERGENCY_FUND,
      FinancialInsightGeneratorType.NET_WORTH,
      FinancialInsightGeneratorType.GOALS,
    ] as const;
    for (const type of required) {
      expect(registered.has(type), `Missing generator: ${type}`).toBe(true);
    }
  });

  it("each call returns a fresh engine instance", () => {
    const a = createDefaultFinancialInsightEngine();
    const b = createDefaultFinancialInsightEngine();
    expect(a).not.toBe(b);
  });
});

describe("createDefaultFinancialInsightService", () => {
  it("returns a valid service instance", () => {
    const service = createDefaultFinancialInsightService();
    expect(service).toBeTruthy();
  });

  it("each call returns a fresh service instance", () => {
    const a = createDefaultFinancialInsightService();
    const b = createDefaultFinancialInsightService();
    expect(a).not.toBe(b);
  });
});
