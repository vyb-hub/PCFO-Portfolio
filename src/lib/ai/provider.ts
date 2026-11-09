export interface AIProvider {
  complete(systemPrompt: string, userMessage: string, options?: { maxTokens?: number; temperature?: number }): Promise<string>;
  completeJSON<T>(systemPrompt: string, userMessage: string, options?: { maxTokens?: number }): Promise<T>;
  completeWithPDF(systemPrompt: string, userMessage: string, pdfBase64: string, options?: { maxTokens?: number; temperature?: number }): Promise<string>;
  // Handle any attachment type: PDF, image/*, text/csv, message/rfc822, etc.
  completeWithAttachment(systemPrompt: string, userMessage: string, data: string, mimeType: string, options?: { maxTokens?: number }): Promise<string>;
}

export async function callWithRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const is429 = msg.includes("429") || msg.includes("Too Many Requests");
      const retryMatch = msg.match(/retry in (\d+(?:\.\d+)?)s/i);
      const delaySec = retryMatch?.[1] ? parseFloat(retryMatch[1]) : 2 ** (attempt + 1) * 5;

      if (is429 && attempt < retries - 1) {
        await new Promise((r) => setTimeout(r, delaySec * 1000));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Max retries exceeded");
}

let _provider: AIProvider | null = null;

export function getProvider(): AIProvider {
  if (_provider) return _provider;
  if (process.env.AI_API_KEY) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { AnthropicProvider } = require("./providers/anthropic");
    _provider = new AnthropicProvider();
  } else if (process.env.GEMINI_API_KEY) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { GeminiProvider } = require("./providers/gemini");
    _provider = new GeminiProvider();
  } else {
    throw new Error("AI_DISABLED");
  }
  return _provider!;
}

export function isAIEnabled(): boolean {
  return !!(process.env.AI_API_KEY || process.env.GEMINI_API_KEY);
}
