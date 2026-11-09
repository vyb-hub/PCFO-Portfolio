import { google } from "googleapis";
import { decrypt, encrypt } from "@/lib/crypto/encryption";
import { db } from "@/lib/db/prisma";

const READONLY_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
const ATTACHMENT_SIZE_LIMIT = 10 * 1024 * 1024; // 10 MB
const ATTACHMENT_MIN_SIZE = 512; // skip tracking pixels and tiny inline icons

export function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
  );
}

export interface GmailTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  token_type: string;
  scope: string;
}

export async function getAuthorizedClient(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { encryptedTokens: true },
  });

  if (!user?.encryptedTokens) {
    throw new Error("No Gmail tokens found for user");
  }

  const tokens: GmailTokens = JSON.parse(decrypt(user.encryptedTokens));
  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials(tokens);

  oauth2Client.on("tokens", async (newTokens) => {
    const merged: GmailTokens = {
      access_token: newTokens.access_token ?? tokens.access_token,
      refresh_token: newTokens.refresh_token ?? tokens.refresh_token,
      expiry_date: newTokens.expiry_date ?? tokens.expiry_date,
      token_type: newTokens.token_type ?? tokens.token_type,
      scope: newTokens.scope ?? tokens.scope,
    };
    await db.user.update({
      where: { id: userId },
      data: { encryptedTokens: encrypt(JSON.stringify(merged)) },
    });
  });

  return google.gmail({ version: "v1", auth: oauth2Client });
}

export async function storeTokens(
  userId: string,
  tokens: GmailTokens
): Promise<void> {
  if (!tokens.scope?.includes(READONLY_SCOPE)) {
    throw new Error("Insufficient Gmail scope — readonly scope required");
  }
  await db.user.update({
    where: { id: userId },
    data: { encryptedTokens: encrypt(JSON.stringify(tokens)) },
  });
}

export interface GmailAttachment {
  gmailAttachmentId: string | null;
  filename: string;
  mimeType: string;
  size: number;
  data: string; // standard base64 (not url-safe)
}

export interface GmailMessage {
  id: string;
  threadId: string;
  subject: string;
  sender: string;
  senderName: string;
  snippet: string;
  body: string;
  receivedAt: Date;
  labelIds: string[];
  attachments: GmailAttachment[];
}

export async function fetchEmails(
  userId: string,
  query: string,
  maxResults = 100,
  pageToken?: string
): Promise<{ messages: GmailMessage[]; nextPageToken?: string }> {
  const gmail = await getAuthorizedClient(userId);

  const listRes = await gmail.users.messages.list({
    userId: "me",
    q: query,
    maxResults,
    pageToken,
  });

  const messageIds = listRes.data.messages ?? [];
  const nextPageToken = listRes.data.nextPageToken ?? undefined;

  const messages = await Promise.allSettled(
    messageIds.map((m) => fetchSingleEmail(gmail, m.id!))
  );

  return {
    messages: messages
      .filter((r): r is PromiseFulfilledResult<GmailMessage> => r.status === "fulfilled")
      .map((r) => r.value),
    nextPageToken,
  };
}

async function fetchSingleEmail(
  gmail: ReturnType<typeof google.gmail>,
  messageId: string
): Promise<GmailMessage> {
  const res = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });

  const msg = res.data;
  const headers = msg.payload?.headers ?? [];

  const getHeader = (name: string) =>
    headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? "";

  const subject = getHeader("subject");
  const from = getHeader("from");
  const dateStr = getHeader("date");

  const { name: senderName, email: senderEmail } = parseFrom(from);
  const body = extractBody(msg.payload);
  const receivedAt = dateStr ? new Date(dateStr) : new Date();
  const attachments = await fetchAttachments(gmail, messageId, msg.payload);

  return {
    id: msg.id!,
    threadId: msg.threadId ?? "",
    subject,
    sender: senderEmail,
    senderName,
    snippet: msg.snippet ?? "",
    body: body.substring(0, 2500),
    receivedAt,
    labelIds: msg.labelIds ?? [],
    attachments,
  };
}

// ── Attachment extraction ─────────────────────────────────────

type PartLike = {
  mimeType?: string | null;
  filename?: string | null;
  body?: {
    data?: string | null;
    attachmentId?: string | null;
    size?: number | null;
  } | null;
  parts?: PartLike[] | null;
};

interface AttachmentRef {
  attachmentId?: string;
  inlineData?: string;
  filename: string;
  mimeType: string;
  size: number;
}

function collectAttachmentRefs(part: PartLike | null | undefined, depth = 0): AttachmentRef[] {
  if (!part || depth > 10) return [];

  const results: AttachmentRef[] = [];
  const mimeType = part.mimeType ?? "";
  const isContainer = mimeType.startsWith("multipart/");
  const isBodyText = mimeType === "text/plain" || mimeType === "text/html";
  const size = part.body?.size ?? 0;

  if (!isContainer && !isBodyText && size >= ATTACHMENT_MIN_SIZE) {
    results.push({
      attachmentId: part.body?.attachmentId ?? undefined,
      inlineData: part.body?.data ?? undefined,
      filename: part.filename ?? "",
      mimeType,
      size,
    });
  }

  for (const child of part.parts ?? []) {
    results.push(...collectAttachmentRefs(child, depth + 1));
  }

  return results;
}

async function fetchAttachments(
  gmail: ReturnType<typeof google.gmail>,
  messageId: string,
  payload: PartLike | null | undefined
): Promise<GmailAttachment[]> {
  const refs = collectAttachmentRefs(payload);
  const results: GmailAttachment[] = [];

  for (const ref of refs) {
    if (ref.size > ATTACHMENT_SIZE_LIMIT) continue;

    let rawBase64url = ref.inlineData;

    if (!rawBase64url && ref.attachmentId) {
      try {
        const res = await gmail.users.messages.attachments.get({
          userId: "me",
          messageId,
          id: ref.attachmentId,
        });
        rawBase64url = res.data.data ?? undefined;
      } catch {
        continue;
      }
    }

    if (!rawBase64url) continue;

    // Normalise base64url → standard base64 for AI providers
    const data = rawBase64url.replace(/-/g, "+").replace(/_/g, "/");

    results.push({
      gmailAttachmentId: ref.attachmentId ?? null,
      filename: ref.filename,
      mimeType: ref.mimeType,
      size: ref.size,
      data,
    });
  }

  return results;
}

// ── Body extraction ───────────────────────────────────────────

function extractBody(
  payload: {
    mimeType?: string | null;
    body?: { data?: string | null } | null;
    parts?: Array<{ mimeType?: string | null; body?: { data?: string | null } | null; parts?: unknown[] | null }> | null;
  } | undefined | null
): string {
  if (!payload) return "";

  const decodeBase64 = (data: string) =>
    Buffer.from(data, "base64url").toString("utf-8");

  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return decodeBase64(payload.body.data);
  }

  if (payload.mimeType === "text/html" && payload.body?.data) {
    return stripHtml(decodeBase64(payload.body.data));
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      const text = extractBody(part as Parameters<typeof extractBody>[0]);
      if (text) return text;
    }
  }

  return "";
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function parseFrom(from: string): { name: string; email: string } {
  const match = from.match(/^"?([^"<]*)"?\s*<?([^>]+)?>?$/);
  if (match) {
    return {
      name: (match[1] ?? "").trim(),
      email: (match[2] ?? from).trim().toLowerCase(),
    };
  }
  return { name: "", email: from.trim().toLowerCase() };
}

export async function getHistoryId(userId: string): Promise<string | null> {
  const gmail = await getAuthorizedClient(userId);
  const res = await gmail.users.getProfile({ userId: "me" });
  return res.data.historyId ?? null;
}
