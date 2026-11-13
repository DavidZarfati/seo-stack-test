import type { NextConfig } from "next";

// Il sito di test NON deve essere indicizzato: si attiva solo con SITE_INDEXABLE=true.
const indexable = process.env.SITE_INDEXABLE === "true";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // partialPrefetching disattivato di proposito: per URL non pre-generati la prima richiesta
  // aspetta la pagina completa, così lo status HTTP (200/404) è corretto per Google.
  async redirects() {
    return [{ source: "/", destination: "/en", permanent: false }];
  },
  async headers() {
    const security = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "DENY" },
    ];
    const noindex = indexable ? [] : [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
    return [{ source: "/:path*", headers: [...security, ...noindex] }];
  },
};

export default nextConfig;
