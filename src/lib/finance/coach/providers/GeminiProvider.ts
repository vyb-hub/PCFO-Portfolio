import type { LLMProvider, LLMRequest, LLMResponse } from "../LLMProvider";

/**
 * Gemini LLM provider stub.
 *
 * Implementation checklist (when implementing):
 *   1. Install: npm install @google/generative-ai
 *   2. Construct a GoogleGenerativeAI client with this.apiKey
 *   3. Call generateContent() with the assembled messages
 *   4. Map the response to LLMResponse (content, model, token counts)
 *
 * The CoachService never imports this class directly — it depends only
 * on the LLMProvider interface. Wire this in at the DI/application layer.
 *
 * Recommended model: "gemini-2.0-flash" (low latency, low cost for coaching)
 * Fallback model:    "gemini-1.5-flash"
 */
export class GeminiProvider implements LLMProvider {
  constructor(
    private readonly apiKey: string,
    readonly model = "gemini-2.0-flash",
  ) {}

  async complete(_request: LLMRequest): Promise<LLMResponse> {
    throw new Error(
      "GeminiProvider is not yet implemented. " +
        "Install @google/generative-ai and implement the complete() method.",
    );
  }
}
