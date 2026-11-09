import { getProvider, isAIEnabled as _isAIEnabled } from "./provider";

export function isAIEnabled(): boolean {
  return _isAIEnabled();
}

export async function complete(
  systemPrompt: string,
  userMessage: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  return getProvider().complete(systemPrompt, userMessage, options);
}

export async function completeJSON<T>(
  systemPrompt: string,
  userMessage: string,
  options?: { maxTokens?: number }
): Promise<T> {
  return getProvider().completeJSON<T>(systemPrompt, userMessage, options);
}

export async function completeWithAttachment(
  systemPrompt: string,
  userMessage: string,
  data: string,
  mimeType: string,
  options?: { maxTokens?: number }
): Promise<string> {
  return getProvider().completeWithAttachment(systemPrompt, userMessage, data, mimeType, options);
}
