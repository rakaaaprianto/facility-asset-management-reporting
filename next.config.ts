import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' ws: wss: https:; frame-ancestors 'none';",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const allowedOrigins = [
  "localhost:3000",
  "127.0.0.1:3000",
  "*.vercel.app",
  "monthly-reportfam.web.id",
  "*.monthly-reportfam.web.id",
];

// Allow optional custom origin from environment
const customOrigin = process.env.APP_ORIGIN || process.env.NEXT_PUBLIC_APP_URL;
if (customOrigin) {
  const host = customOrigin.replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (host && !allowedOrigins.includes(host)) {
    allowedOrigins.push(host);
  }
}
if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (vercelHost && !allowedOrigins.includes(vercelHost)) {
    allowedOrigins.push(vercelHost);
  }
}

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
      allowedOrigins,
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
