import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Las rutas de generación de PDF leen fuentes (.ttf) y el logo desde el
  // sistema de archivos en runtime. En Vercel esos archivos NO se incluyen
  // en el bundle de la función a menos que se declaren aquí explícitamente.
  outputFileTracingIncludes: {
    "/api/pdf/contract/[id]": ["./assets/fonts/**", "./public/brand/**"],
    "/api/pdf/quote/[id]": ["./assets/fonts/**", "./public/brand/**"],
  },
};

export default nextConfig;
