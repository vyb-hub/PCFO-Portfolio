import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: "standalone",

  // pdfjs-dist's fake-worker fallback (used in Node) dynamically imports its
  // worker file by string, not a literal import()/require(), so Next's file
  // tracer misses it and it's dropped from the standalone/serverless bundle.
  outputFileTracingIncludes: {
    "/api/analyzer/upload": ["./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https://lh3.googleusercontent.com",
              "connect-src 'self' https://accounts.google.com https://www.googleapis.com",
              "frame-ancestors 'none'",
            ].join("; "),
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },

  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000"] },
  },
};

export default nextConfig;
