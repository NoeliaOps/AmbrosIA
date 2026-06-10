import type { NextConfig } from "next";

// ── Cabeceras de seguridad ──────────────────────────────────────────────────
// CSP afinada al stack real: Next 16 (scripts/estilos inline para hidratación),
// fuentes auto-hospedadas vía next/font (origen propio, sin CDN externo) y
// Supabase (REST por https + Realtime por wss). object/base/form-action cerrados
// y frame-ancestors 'none' bloquean clickjacking e inyección de <base>.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig: NextConfig = {
  // No revelar el framework/versión en las respuestas.
  poweredByHeader: false,

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },

  // Las rutas de generación de PDF leen fuentes (.ttf) y el logo desde el
  // sistema de archivos en runtime. En Vercel esos archivos NO se incluyen
  // en el bundle de la función a menos que se declaren aquí explícitamente.
  outputFileTracingIncludes: {
    "/api/pdf/contract/[id]": ["./assets/fonts/**", "./public/brand/**"],
    "/api/pdf/quote/[id]": ["./assets/fonts/**", "./public/brand/**"],
  },
};

export default nextConfig;
