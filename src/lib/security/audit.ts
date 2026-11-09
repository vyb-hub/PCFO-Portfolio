import { db } from "@/lib/db/prisma";
import type { NextRequest } from "next/server";

export type AuditAction =
  | "AUTH_LOGIN"
  | "AUTH_LOGOUT"
  | "AUTH_MFA_SETUP"
  | "AUTH_MFA_VERIFY"
  | "AUTH_MFA_FAIL"
  | "AUTH_DEVICE_TRUST"
  | "AUTH_SESSION_REVOKE"
  | "GMAIL_SYNC_START"
  | "GMAIL_SYNC_COMPLETE"
  | "GMAIL_SYNC_ERROR"
  | "GMAIL_TOKEN_REFRESH"
  | "TRANSACTION_CREATE"
  | "TRANSACTION_UPDATE"
  | "TRANSACTION_DELETE"
  | "INSIGHT_GENERATE"
  | "BUDGET_CREATE"
  | "BUDGET_UPDATE"
  | "SETTINGS_UPDATE"
  | "EXPORT_DATA"
  | "SECURITY_LOCKOUT"
  | "SECURITY_ALERT"
  | "PAN_ACCESSED";

interface AuditParams {
  userId?: string;
  action: AuditAction;
  resource?: string;
  resourceId?: string;
  success?: boolean;
  error?: string;
  metadata?: Record<string, unknown>;
  request?: NextRequest;
}

export async function audit(params: AuditParams): Promise<void> {
  try {
    const ip = params.request
      ? (params.request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
         params.request.headers.get("x-real-ip") ??
         "unknown")
      : undefined;

    const userAgent = params.request
      ? params.request.headers.get("user-agent") ?? undefined
      : undefined;

    await db.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        ipAddress: ip,
        userAgent: userAgent,
        success: params.success ?? true,
        error: params.error,
        metadata: params.metadata as never,
      },
    });
  } catch (err) {
    // Audit failures must never crash the app
    console.error("[audit] Failed to write audit log:", err);
  }
}

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
