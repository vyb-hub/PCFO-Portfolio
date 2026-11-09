import type { LLMProvider, LLMRequest, LLMResponse } from "./LLMProvider";

/**
 * A no-op LLM provider that returns a canned placeholder response.
 *
 * Used as the default when no real LLM provider is configured.
 * Allows the full coaching pipeline (intent detection, context assembly,
 * prompt building) to run and be tested without an active API key.
 *
 * Replace with GeminiProvider or OpenAIProvider at the DI wiring layer
 * once an LLM API is configured.
 */
export class NullLLMProvider implements LLMProvider {
  readonly model = "null";

  async complete(_request: LLMRequest): Promise<LLMResponse> {
    return {
      content:
        "This is a placeholder response. The AI Coach is not yet connected to a language model. " +
        "Configure a real LLM provider (GeminiProvider or OpenAIProvider) to enable AI coaching.",
      model: this.model,
      promptTokens: null,
      completionTokens: null,
      finishReason: "stop",
    };
  }
}
