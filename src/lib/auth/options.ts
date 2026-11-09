import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db/prisma";
import { encrypt } from "@/lib/crypto/encryption";
import { audit } from "@/lib/security/audit";
import type { GmailTokens } from "@/lib/gmail/client";

const ALLOWED_EMAIL = process.env.ALLOWED_EMAIL;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as never,

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/gmail.readonly",
          ].join(" "),
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: parseInt(process.env.SESSION_MAX_AGE_SECONDS ?? "28800"),
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    async signIn({ user, account }) {
      // Only allow the configured owner email
      if (ALLOWED_EMAIL && user.email !== ALLOWED_EMAIL) {
        console.warn(`[auth] Blocked login attempt from: ${user.email}`);
        await audit({
          action: "AUTH_LOGIN",
          success: false,
          error: "Unauthorized email",
          metadata: { email: user.email },
        });
        return false;
      }

      // Store Gmail tokens securely
      if (account?.provider === "google" && account.access_token) {
        const tokens: GmailTokens = {
          access_token: account.access_token,
          refresh_token: account.refresh_token ?? "",
          expiry_date: account.expires_at
            ? account.expires_at * 1000
            : Date.now() + 3600000,
          token_type: "Bearer",
          scope: account.scope ?? "",
        };

        try {
          const dbUser = await db.user.findUnique({
            where: { email: user.email! },
            select: { id: true },
          });

          if (dbUser) {
            await db.user.update({
              where: { id: dbUser.id },
              data: {
                encryptedTokens: encrypt(JSON.stringify(tokens)),
                lastLoginAt: new Date(),
              },
            });
          } else {
            console.error("[auth] signIn: user not found in DB after adapter create:", user.email);
          }
        } catch (err) {
          console.error("[auth] signIn: failed to store Gmail tokens:", err);
        }
      }

      return true;
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;

        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { totpEnabled: true },
        });
        token.totpEnabled = dbUser?.totpEnabled ?? false;
        token.mfaVerified = !dbUser?.totpEnabled; // Auto-verified if MFA not set up
      }

      if (trigger === "update") {
        // Propagate mfaVerified flag after server-side TOTP validation
        if ((session as { mfaVerified?: boolean })?.mfaVerified === true) {
          token.mfaVerified = true;
        }
        if (token.id) {
          const dbUser = await db.user.findUnique({
            where: { id: token.id as string },
            select: { totpEnabled: true },
          });
          token.totpEnabled = dbUser?.totpEnabled ?? false;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { totpEnabled?: boolean }).totpEnabled =
          token.totpEnabled as boolean;
        (session.user as { mfaVerified?: boolean }).mfaVerified =
          token.mfaVerified as boolean;
      }
      return session;
    },
  },

  events: {
    async signIn({ user }) {
      await audit({
        userId: user.id,
        action: "AUTH_LOGIN",
        success: true,
      });
    },
    async signOut({ token }) {
      await audit({
        userId: token?.id as string,
        action: "AUTH_LOGOUT",
        success: true,
      });
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
