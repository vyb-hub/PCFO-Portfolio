import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider } from "../provider";
import { callWithRetry } from "../provider";

const MODEL = "GLM-4.7";

export class AnthropicProvider implements AIProvider {
  private _client: Anthropic | null = null;

  private getClient(): Anthropic {
    if (!this._client) {
      this._client = new Anthropic({
        apiKey: process.env.AI_API_KEY!,
        baseURL: process.env.AI_BASE_URL,
      });
    }
    return this._client;
  }

  async complete(
    systemPrompt: string,
    userMessage: string,
    options?: { maxTokens?: number; temperature?: number }
  ): Promise<string> {
    const message = await this.getClient().messages.create({
      model: MODEL,
      max_tokens: options?.maxTokens ?? 1024,
      temperature: options?.temperature ?? 0.3,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const block = message.content[0];
    if (!block || block.type !== "text") throw new Error("Unexpected response type");
    return block.text;
  }

  async completeJSON<T>(
    systemPrompt: string,
    userMessage: string,
    options?: { maxTokens?: number }
  ): Promise<T> {
    return callWithRetry(async () => {
      const message = await this.getClient().messages.create({
        model: MODEL,
        max_tokens: options?.maxTokens ?? 2048,
        temperature: 0.1,
        system: systemPrompt + "\n\nYou MUST respond with valid JSON only. No explanation, no markdown.",
        messages: [{ role: "user", content: userMessage }],
      });

      const block = message.content[0];
      if (!block || block.type !== "text") throw new Error("Unexpected response type");
      const text = block.text
        .trim()
        .replace(/^```(?:json)?\n?/i, "")
        .replace(/\n?```$/i, "")
        .trim();
      return JSON.parse(text) as T;
    });
  }

  async completeWithPDF(
    systemPrompt: string,
    userMessage: string,
    pdfBase64: string,
    options?: { maxTokens?: number; temperature?: number }
  ): Promise<string> {
    return this.completeWithAttachment(systemPrompt, userMessage, pdfBase64, "application/pdf", options);
  }

  async completeWithAttachment(
    systemPrompt: string,
    userMessage: string,
    data: string,
    mimeType: string,
    options?: { maxTokens?: number }
  ): Promise<string> {
    const isPdf = mimeType === "application/pdf";
    const isImage = mimeType.startsWith("image/");
    const isText = mimeType === "text/csv" || mimeType === "message/rfc822" || mimeType === "text/plain";
    const jsonSystem = systemPrompt + "\n\nYou MUST respond with valid JSON only. No explanation, no markdown.";
    const strip = (s: string) =>
      s.trim().replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

    if (isPdf) {
      const message = await this.getClient().messages.create({
        model: MODEL,
        max_tokens: options?.maxTokens ?? 8192,
        temperature: 0.1,
        system: jsonSystem,
        messages: [
          {
            role: "user",
            content: [
              { type: "document", source: { type: "base64", media_type: "application/pdf", data } },
              { type: "text", text: userMessage },
            ],
          },
        ],
      });
      const block = message.content[0];
      if (!block || block.type !== "text") throw new Error("Unexpected response type");
      return strip(block.text);
    }

    if (isImage) {
      const validImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
      type ImageMediaType = typeof validImageTypes[number];
      const mediaType: ImageMediaType = (validImageTypes as readonly string[]).includes(mimeType)
        ? (mimeType as ImageMediaType)
        : "image/jpeg";

      const message = await this.getClient().messages.create({
        model: MODEL,
        max_tokens: options?.maxTokens ?? 4096,
        temperature: 0.1,
        system: jsonSystem,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data } },
              { type: "text", text: userMessage },
            ],
          },
        ],
      });
      const block = message.content[0];
      if (!block || block.type !== "text") throw new Error("Unexpected response type");
      return strip(block.text);
    }

    if (isText) {
      const decoded = Buffer.from(data, "base64").toString("utf-8");
      return callWithRetry(async () => {
        const message = await this.getClient().messages.create({
          model: MODEL,
          max_tokens: options?.maxTokens ?? 4096,
          temperature: 0.1,
          system: jsonSystem,
          messages: [{ role: "user", content: `${userMessage}\n\n${decoded}` }],
        });
        const block = message.content[0];
        if (!block || block.type !== "text") throw new Error("Unexpected response type");
        return strip(block.text);
      });
    }

    throw new Error(`Unsupported attachment mimeType for AI processing: ${mimeType}`);
  }
}
