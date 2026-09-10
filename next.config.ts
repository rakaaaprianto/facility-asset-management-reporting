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

function sanitizeHost(input: string): string {
  return input.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
}

// Build allowed origins dynamically for Server Actions CSRF protection
const allowedOriginsSet = new Set<string>(["localhost:3000", "127.0.0.1:3000"]);

// Parse multiple origins from ALLOWED_ORIGINS (comma separated)
if (process.env.ALLOWED_ORIGINS) {
  process.env.ALLOWED_ORIGINS.split(",")
    .map(sanitizeHost)
    .filter(Boolean)
    .forEach((host) => allowedOriginsSet.add(host));
}

// Support single APP_ORIGIN / NEXT_PUBLIC_APP_URL
const singleOrigin = process.env.APP_ORIGIN || process.env.NEXT_PUBLIC_APP_URL;
if (singleOrigin) {
  const host = sanitizeHost(singleOrigin);
  if (host) allowedOriginsSet.add(host);
}

const allowedOrigins = Array.from(allowedOriginsSet);

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
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
