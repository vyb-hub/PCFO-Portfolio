import type { LLMProvider, LLMRequest, LLMResponse } from "../LLMProvider";

/**
 * OpenAI LLM provider stub.
 *
 * Implementation checklist (when implementing):
 *   1. Install: npm install openai
 *   2. Construct an OpenAI client with this.apiKey
 *   3. Call client.chat.completions.create() with request.messages
 *   4. Map the response to LLMResponse (content, model, usage token counts)
 *
 * The CoachService never imports this class directly — it depends only
 * on the LLMProvider interface. Wire this in at the DI/application layer.
 *
 * Recommended model: "gpt-4o-mini" (cost-efficient for coaching turns)
 */
export class OpenAIProvider implements LLMProvider {
  constructor(
    private readonly apiKey: string,
    readonly model = "gpt-4o-mini",
  ) {}

  async complete(_request: LLMRequest): Promise<LLMResponse> {
    throw new Error(
      "OpenAIProvider is not yet implemented. " +
        "Install openai and implement the complete() method.",
    );
  }
}
