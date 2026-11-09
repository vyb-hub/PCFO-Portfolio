// Core message and session types
export { CoachRole } from "./CoachMessage";
export type { CoachMessage } from "./CoachMessage";
export { CoachSessionStatus } from "./CoachSession";
export type { CoachSession } from "./CoachSession";

// EC-010: AI Coach Platform
export { CoachIntentType } from "./CoachIntent";
export type { CoachIntent } from "./CoachIntent";
export type { CoachContext } from "./CoachContext";
export type { CoachResponse } from "./CoachResponse";
export type { BuiltPrompt, PromptBuilder } from "./PromptBuilder";
export type { PromptTemplate } from "./PromptTemplate";
export { PROMPT_TEMPLATES, getPromptTemplate } from "./PromptTemplate";
export type { LLMMessage, LLMRequest, LLMResponse, LLMProvider } from "./LLMProvider";
export type { ICoachService } from "./ICoachService";

// Concrete implementations
export { CoachService } from "./CoachService";
export { DefaultPromptBuilder } from "./PromptBuilder";
export { NullLLMProvider } from "./NullLLMProvider";

// Intent detection
export type { IntentDetector } from "./intent/IntentDetector";
export { DefaultIntentDetector } from "./intent/IntentDetector";

// LLM provider stubs (wired at application layer)
export { GeminiProvider } from "./providers/GeminiProvider";
export { OpenAIProvider } from "./providers/OpenAIProvider";
