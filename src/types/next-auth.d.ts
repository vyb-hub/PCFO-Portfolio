import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      totpEnabled: boolean;
      mfaVerified?: boolean;
    };
  }
  interface User {
    id: string;
    totpEnabled?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    totpEnabled: boolean;
    mfaVerified: boolean;
  }
}
