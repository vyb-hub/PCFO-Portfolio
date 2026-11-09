/**
 * A single message in an LLM conversation request.
 */
export interface LLMMessage {
  readonly role: "system" | "user" | "assistant";
  readonly content: string;
}

/**
 * The full request payload sent to an LLM provider.
 */
export interface LLMRequest {
  readonly messages: ReadonlyArray<LLMMessage>;
  /** Model identifier. Defaults to the provider's configured model if omitted. */
  readonly model?: string;
  /** Maximum tokens to generate in the completion. */
  readonly maxTokens?: number;
  /** Sampling temperature (0 = deterministic, 1 = creative). */
  readonly temperature?: number;
}

/**
 * The response payload from an LLM provider.
 */
export interface LLMResponse {
  /** The generated text content. */
  readonly content: string;
  /** The model that produced this response. */
  readonly model: string;
  /** Prompt token count as reported by the provider. Null if unavailable. */
  readonly promptTokens: number | null;
  /** Completion token count as reported by the provider. Null if unavailable. */
  readonly completionTokens: number | null;
  /** Stop reason as reported by the provider ("stop", "max_tokens", etc.). Null if unavailable. */
  readonly finishReason: string | null;
}

/**
 * Provider-agnostic interface for LLM text generation.
 *
 * The AI Coach depends only on this interface. The concrete provider
 * (Gemini, OpenAI, Claude, local Ollama) is injected at the DI layer.
 * Changing the AI provider requires no changes to CoachService or PromptBuilder.
 *
 * Provided implementations:
 *   - NullLLMProvider  — returns a canned response; for dev/testing
 *   - GeminiProvider   — stub; implement with @google/generative-ai SDK
 *   - OpenAIProvider   — stub; implement with openai SDK
 */
export interface LLMProvider {
  /** The default model identifier this provider will use. */
  readonly model: string;

  /**
   * Generate a text completion from the message history.
   * Implementations must be async-safe and should surface provider errors
   * as thrown exceptions so the CoachService can handle them.
   */
  complete(request: LLMRequest): Promise<LLMResponse>;
}
