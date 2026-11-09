import { describe, it, expect } from "vitest";
import { StatementMatcher } from "../StatementMatcher";
import { RequiredStatementType } from "../RequiredStatementType";
import { ChecklistItemStatus } from "../ChecklistItemStatus";
import { makeChecklistItem } from "./testHelpers";

describe("StatementMatcher.suggestMatch()", () => {
  const matcher = new StatementMatcher();

  it("returns null when the upload has no detected account type", () => {
    const items = [makeChecklistItem()];
    expect(matcher.suggestMatch({ accountType: null, institutionName: "HDFC" }, items)).toBeNull();
  });

  it("returns null when no checklist item matches the type", () => {
    const items = [makeChecklistItem({ statementType: RequiredStatementType.CREDIT_CARD })];
    const result = matcher.suggestMatch({ accountType: RequiredStatementType.BANK, institutionName: null }, items);
    expect(result).toBeNull();
  });

  it("ignores SATISFIED items even if they'd otherwise match", () => {
    const items = [makeChecklistItem({ status: ChecklistItemStatus.SATISFIED })];
    const result = matcher.suggestMatch({ accountType: RequiredStatementType.BANK, institutionName: "HDFC" }, items);
    expect(result).toBeNull();
  });

  it("returns the single unambiguous same-type pending item when there's no institution to disambiguate", () => {
    const item = makeChecklistItem({ id: "item-1", statementType: RequiredStatementType.BANK });
    const result = matcher.suggestMatch({ accountType: RequiredStatementType.BANK, institutionName: null }, [item]);
    expect(result?.id).toBe("item-1");
  });

  it("returns null when multiple same-type pending items exist and institution doesn't disambiguate", () => {
    const items = [
      makeChecklistItem({ id: "item-1", label: "HDFC Savings", statementType: RequiredStatementType.BANK }),
      makeChecklistItem({ id: "item-2", label: "ICICI Savings", statementType: RequiredStatementType.BANK }),
    ];
    const result = matcher.suggestMatch({ accountType: RequiredStatementType.BANK, institutionName: "SBI" }, items);
    expect(result).toBeNull();
  });

  it("prefers an exact institution-name match among same-type candidates", () => {
    const items = [
      makeChecklistItem({ id: "item-1", label: "HDFC Savings", statementType: RequiredStatementType.BANK }),
      makeChecklistItem({ id: "item-2", label: "ICICI Savings", statementType: RequiredStatementType.BANK }),
    ];
    const result = matcher.suggestMatch({ accountType: RequiredStatementType.BANK, institutionName: "ICICI" }, items);
    expect(result?.id).toBe("item-2");
  });

  it("is case-insensitive when matching institution name against the label", () => {
    const item = makeChecklistItem({ id: "item-1", label: "HDFC Savings", statementType: RequiredStatementType.BANK });
    const result = matcher.suggestMatch({ accountType: RequiredStatementType.BANK, institutionName: "hdfc" }, [item]);
    expect(result?.id).toBe("item-1");
  });
});
