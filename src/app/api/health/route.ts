import { NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";
import { APP_VERSION } from "@/lib/version";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: APP_VERSION,
    });
  } catch {
    return NextResponse.json(
      { status: "unhealthy", error: "Database connection failed" },
      { status: 503 }
    );
  }
}
