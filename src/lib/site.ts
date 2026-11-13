export const LANGS = ["en", "it"] as const;
export type Lang = (typeof LANGS)[number];

export function isLang(value: string): value is Lang {
  return (LANGS as readonly string[]).includes(value);
}

// URL pubblico del sito. In produzione Vercel espone il dominio di produzione.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

// Per il test il sito NON deve essere indicizzato. Si attiva solo con SITE_INDEXABLE=true.
export const INDEXABLE = process.env.SITE_INDEXABLE === "true";

export const UI = {
  en: {
    siteName: "SEO Stack Test",
    listTitle: "Articles",
    listIntro: "Fictional articles used to test a server-rendered, SEO-first website stack.",
    back: "All articles",
    notFoundTitle: "Page not found",
    notFoundText: "This page does not exist.",
    published: "Published",
  },
  it: {
    siteName: "SEO Stack Test",
    listTitle: "Articoli",
    listIntro: "Articoli di fantasia per provare uno stack SEO con rendering lato server.",
    back: "Tutti gli articoli",
    notFoundTitle: "Pagina non trovata",
    notFoundText: "Questa pagina non esiste.",
    published: "Pubblicato",
  },
} as const;
