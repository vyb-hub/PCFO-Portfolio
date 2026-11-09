import { describe, it, expect } from "vitest";
import { PrismaInvestmentRepository } from "../PrismaInvestmentRepository";
import { InvestmentStatus } from "../../../finance/investments/Investment";

const repo = new PrismaInvestmentRepository();

describe("PrismaInvestmentRepository — stub (no Investment model in DB)", () => {
  it("findByUser returns empty array", async () => {
    expect(await repo.findByUser("u1")).toHaveLength(0);
  });

  it("findActive returns empty array", async () => {
    expect(await repo.findActive("u1")).toHaveLength(0);
  });

  it("findByStatus returns empty array", async () => {
    expect(await repo.findByStatus("u1", InvestmentStatus.ACTIVE)).toHaveLength(0);
  });

  it("findById returns null", async () => {
    expect(await repo.findById("u1", "i1")).toBeNull();
  });
});
