import { describe, it, expect } from "vitest";
import { ConversationIntentResolver } from "../ConversationIntentResolver";
import { ConversationIntentType } from "../ConversationIntentType";

describe("ConversationIntentResolver — resolve()", () => {
  const resolver = new ConversationIntentResolver();

  it.each([
    ["/daily", ConversationIntentType.DAILY_BRIEF],
    ["/weekly", ConversationIntentType.WEEKLY_REVIEW],
    ["/monthly", ConversationIntentType.MONTHLY_REVIEW],
    ["/health", ConversationIntentType.FINANCIAL_HEALTH],
    ["/expense", ConversationIntentType.LARGEST_EXPENSE],
    ["/risk", ConversationIntentType.TOP_RISK],
    ["/goals", ConversationIntentType.GOAL_PROGRESS],
    ["/whatschanged", ConversationIntentType.WHATS_CHANGED],
  ])("resolves exact command %s to %s with confidence 1.0", (command, expected) => {
    const intent = resolver.resolve(command);
    expect(intent.type).toBe(expected);
    expect(intent.confidence).toBe(1.0);
    expect(intent.referencedId).toBeNull();
  });

  it("is case-insensitive for commands", () => {
    expect(resolver.resolve("/DAILY").type).toBe(ConversationIntentType.DAILY_BRIEF);
  });

  it("parses an id argument for /explainstory", () => {
    const intent = resolver.resolve("/explainstory block-123");
    expect(intent.type).toBe(ConversationIntentType.EXPLAIN_STORY);
    expect(intent.referencedId).toBe("block-123");
  });

  it("parses an id argument for /explainrec, preserving its original casing", () => {
    const intent = resolver.resolve("/explainrec SAVINGS_RATE_LOW");
    expect(intent.type).toBe(ConversationIntentType.EXPLAIN_RECOMMENDATION);
    expect(intent.referencedId).toBe("SAVINGS_RATE_LOW");
  });

  it("returns UNKNOWN for an id command with no argument (referencedId null)", () => {
    const intent = resolver.resolve("/explainstory");
    expect(intent.type).toBe(ConversationIntentType.EXPLAIN_STORY);
    expect(intent.referencedId).toBeNull();
  });

  it("returns UNKNOWN for an unrecognised slash command", () => {
    const intent = resolver.resolve("/frobnicate");
    expect(intent.type).toBe(ConversationIntentType.UNKNOWN);
    expect(intent.confidence).toBe(0);
  });

  it("resolves free text via keyword fallback", () => {
    const intent = resolver.resolve("what's my largest expense this month?");
    expect(intent.type).toBe(ConversationIntentType.LARGEST_EXPENSE);
    expect(intent.confidence).toBeGreaterThan(0);
    expect(intent.matchedKeywords.length).toBeGreaterThan(0);
  });

  it("returns UNKNOWN for free text matching no keywords", () => {
    const intent = resolver.resolve("what's the weather like today");
    expect(intent.type).toBe(ConversationIntentType.UNKNOWN);
  });

  it("preserves the original rawInput casing", () => {
    const intent = resolver.resolve("What Changed This Month?");
    expect(intent.rawInput).toBe("What Changed This Month?");
    expect(intent.type).toBe(ConversationIntentType.WHATS_CHANGED);
  });
});

describe("ConversationIntentResolver — resolveCallback()", () => {
  const resolver = new ConversationIntentResolver();

  it("resolves a bare type callback", () => {
    const intent = resolver.resolveCallback("FINANCIAL_HEALTH");
    expect(intent.type).toBe(ConversationIntentType.FINANCIAL_HEALTH);
    expect(intent.referencedId).toBeNull();
    expect(intent.confidence).toBe(1.0);
  });

  it("resolves a type:id callback", () => {
    const intent = resolver.resolveCallback("EXPLAIN_STORY:block-123");
    expect(intent.type).toBe(ConversationIntentType.EXPLAIN_STORY);
    expect(intent.referencedId).toBe("block-123");
  });

  it("returns UNKNOWN for an unrecognised type", () => {
    const intent = resolver.resolveCallback("NOT_A_REAL_TYPE:xyz");
    expect(intent.type).toBe(ConversationIntentType.UNKNOWN);
  });
});
