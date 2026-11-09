import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIProvider } from "../provider";
import { callWithRetry } from "../provider";

const MODEL = "gemini-2.0-flash";

export class GeminiProvider implements AIProvider {
  private _client: GoogleGenerativeAI | null = null;

  private getClient(): GoogleGenerativeAI {
    if (!this._client) {
      this._client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    }
    return this._client;
  }

  async complete(
    systemPrompt: string,
    userMessage: string,
    options?: { maxTokens?: number; temperature?: number }
  ): Promise<string> {
    const model = this.getClient().getGenerativeModel({
      model: MODEL,
      systemInstruction: systemPrompt,
      generationConfig: {
        maxOutputTokens: options?.maxTokens ?? 1024,
        temperature: options?.temperature ?? 0.3,
      },
    });

    const result = await model.generateContent(userMessage);
    return result.response.text();
  }

  async completeJSON<T>(
    systemPrompt: string,
    userMessage: string,
    options?: { maxTokens?: number }
  ): Promise<T> {
    const model = this.getClient().getGenerativeModel({
      model: MODEL,
      systemInstruction:
        systemPrompt + "\n\nYou MUST respond with valid JSON only. No explanation, no markdown.",
      generationConfig: {
        maxOutputTokens: options?.maxTokens ?? 2048,
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    });

    return callWithRetry(async () => {
      const result = await model.generateContent(userMessage);
      const text = result.response
        .text()
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

    if (isPdf || isImage) {
      const model = this.getClient().getGenerativeModel({
        model: MODEL,
        systemInstruction: jsonSystem,
        generationConfig: {
          maxOutputTokens: options?.maxTokens ?? 8192,
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      });

      const result = await model.generateContent([
        { inlineData: { data, mimeType } },
        userMessage,
      ]);

      return result.response
        .text()
        .trim()
        .replace(/^```(?:json)?\n?/i, "")
        .replace(/\n?```$/i, "")
        .trim();
    }

    if (isText) {
      const decoded = Buffer.from(data, "base64").toString("utf-8");
      const model = this.getClient().getGenerativeModel({
        model: MODEL,
        systemInstruction: jsonSystem,
        generationConfig: {
          maxOutputTokens: options?.maxTokens ?? 4096,
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      });

      const result = await model.generateContent(`${userMessage}\n\n${decoded}`);
      return result.response
        .text()
        .trim()
        .replace(/^```(?:json)?\n?/i, "")
        .replace(/\n?```$/i, "")
        .trim();
    }

    throw new Error(`Unsupported attachment mimeType for AI processing: ${mimeType}`);
  }
}
