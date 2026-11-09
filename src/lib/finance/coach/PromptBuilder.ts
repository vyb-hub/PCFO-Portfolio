import type { LLMMessage } from "./LLMProvider";
import type { CoachContext } from "./CoachContext";
import { getPromptTemplate } from "./PromptTemplate";
import { CoachRole } from "./CoachMessage";

/**
 * The output of a PromptBuilder.build() call.
 *
 * All fields are pre-formatted strings ready for transmission to the LLM.
 * The `messages` array is the complete message list for the LLM request.
 */
export interface BuiltPrompt {
  /** The assembled system instruction for this intent. */
  readonly systemInstruction: string;
  /** The financial memory context block injected into the system message. */
  readonly contextBlock: string;
  /** Full message array ready for LLMProvider.complete(). */
  readonly messages: ReadonlyArray<LLMMessage>;
  /** Rough character count — used for token estimation and context window checks. */
  readonly estimatedCharacters: number;
}

/**
 * Transforms a CoachContext into a BuiltPrompt ready for LLM submission.
 *
 * The PromptBuilder is the only place where financial context, conversation
 * history, and system instructions are assembled into a prompt. This isolation
 * makes prompt engineering changes — instruction wording, context formatting,
 * history windowing — a single-file concern.
 */
export interface PromptBuilder {
  build(context: CoachContext): BuiltPrompt;
}

/**
 * Default prompt builder.
 *
 * Prompt structure:
 *   SYSTEM: {intent system instruction}
 *           ---FINANCIAL CONTEXT---
 *           {memoryContext.contextText}
 *           -----------------------
 *
 *   [Prior conversation turns as alternating user/assistant messages]
 *
 *   USER: {current user query}
 *
 * History is bounded to the last MAX_HISTORY_TURNS turns to avoid
 * exceeding typical LLM context windows.
 */
export class DefaultPromptBuilder implements PromptBuilder {
  private static readonly MAX_HISTORY_TURNS = 10;

  build(context: CoachContext): BuiltPrompt {
    const template = getPromptTemplate(context.intent.type);

    const contextBlock =
      context.memoryContext.entries.length === 0
        ? "(No financial history available for this user yet.)"
        : context.memoryContext.contextText;

    const systemInstruction =
      template.systemInstruction +
      "\n\n---FINANCIAL CONTEXT---\n" +
      contextBlock +
      "\n-----------------------";

    const messages: LLMMessage[] = [{ role: "system", content: systemInstruction }];

    // Inject bounded conversation history
    const history = context.conversationHistory.slice(-DefaultPromptBuilder.MAX_HISTORY_TURNS);
    for (const msg of history) {
      if (msg.role === CoachRole.USER) {
        messages.push({ role: "user", content: msg.content });
      } else if (msg.role === CoachRole.ASSISTANT) {
        messages.push({ role: "assistant", content: msg.content });
      }
      // SYSTEM role messages in history are not re-injected to avoid duplication
    }

    // Current user message
    messages.push({ role: "user", content: context.userQuery });

    const frozenMessages = Object.freeze(messages.map(m => Object.freeze(m)));
    const estimatedCharacters = frozenMessages.reduce((sum, m) => sum + m.content.length, 0);

    return Object.freeze({
      systemInstruction,
      contextBlock,
      messages: frozenMessages,
      estimatedCharacters,
    });
  }
}
