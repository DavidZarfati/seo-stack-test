// Controlli SEO tecnici sul sito costruito. Uso: BASE_URL=http://localhost:3000 EXPECT_INDEXABLE=true node scripts/seo-check.mjs
import { appendFileSync, readFileSync } from "node:fs";
import * as cheerio from "cheerio";

const BASE = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const EXPECT_INDEXABLE = process.env.EXPECT_INDEXABLE === "true";
const cfg = JSON.parse(readFileSync(new URL("../seo.config.json", import.meta.url), "utf8")).technical;

const errors = [];
const warnings = [];
const error = (url, msg) => errors.push({ url, msg });
const warn = (url, msg) => warnings.push({ url, msg });

async function get(path, init = {}) {
  const res = await fetch(BASE + path, { redirect: "manual", ...init });
  const text = init.method === "HEAD" ? "" : await res.text();
  return { res, text };
}

function checkPage(path, kind, res, html) {
  const $ = cheerio.load(html);
  const lang = path.split("/")[1];

  if ($("html").attr("lang") !== lang) error(path, `<html lang> è "${$("html").attr("lang")}", atteso "${lang}"`);

  const title = $("head title").first().text().trim();
  if (!title) error(path, "title mancante");
  else {
    if (title.length < cfg.titleMin || title.length > cfg.titleMax) error(path, `title di ${title.length} caratteri (ammessi ${cfg.titleMin}-${cfg.titleMax})`);
    else if (title.length > cfg.titleWarnAbove) warn(path, `title lungo (${title.length} caratteri), rischio di taglio nei risultati`);
  }

  const desc = $('meta[name="description"]').attr("content")?.trim() ?? "";
  if (!desc) error(path, "meta description mancante");
  else if (desc.length < cfg.descriptionMin || desc.length > cfg.descriptionMax) warn(path, `meta description di ${desc.length} caratteri (consigliati ${cfg.descriptionMin}-${cfg.descriptionMax})`);

  const h1s = $("h1").length;
  if (h1s !== 1) error(path, `trovati ${h1s} H1 (deve essere esattamente 1)`);

  const canonical = $('link[rel="canonical"]').attr("href");
  if (!canonical) error(path, "canonical mancante");
  else {
    try {
      const u = new URL(canonical);
      if (u.pathname !== path) error(path, `canonical punta a "${u.pathname}", atteso "${path}"`);
    } catch {
      error(path, `canonical non è un URL assoluto: ${canonical}`);
    }
  }

  // Indicizzazione coerente con la modalità attesa
  const headerRobots = res.headers.get("x-robots-tag") ?? "";
  const metaRobots = $('meta[name="robots"]').attr("content") ?? "";
  const noindex = /noindex/i.test(headerRobots) || /noindex/i.test(metaRobots);
  if (EXPECT_INDEXABLE && noindex) error(path, "la pagina è noindex ma doveva essere indicizzabile");
  if (!EXPECT_INDEXABLE && !noindex) error(path, "la pagina NON è noindex ma doveva esserlo (sito di test)");

  // Sicurezza di base negli header
  if (res.headers.get("x-content-type-options") !== "nosniff") warn(path, "manca X-Content-Type-Options: nosniff");

  for (const img of $("img").toArray()) if (!$(img).attr("alt")) error(path, `immagine senza alt: ${$(img).attr("src")}`);

  if (kind === "article") {
    const raw = $('script[type="application/ld+json"]').first().text();
    if (!raw) error(path, "dati strutturati JSON-LD mancanti");
    else {
      try {
        const ld = JSON.parse(raw);
        if (ld["@type"] !== "Article") error(path, `JSON-LD @type "${ld["@type"]}", atteso Article`);
        for (const f of ["headline", "datePublished", "dateModified", "inLanguage"]) if (!ld[f]) error(path, `JSON-LD senza "${f}"`);
      } catch {
        error(path, "JSON-LD non è JSON valido");
      }
    }
    for (const p of ["og:title", "og:description", "og:url", "og:type"]) if (!$(`meta[property="${p}"]`).attr("content")) error(path, `manca ${p}`);
  } else {
    const alts = $('link[rel="alternate"][hreflang]').toArray().map((a) => $(a).attr("hreflang"));
    if (!alts.includes("x-default") || alts.length < 3) error(path, `hreflang incompleti: ${alts.join(", ") || "nessuno"}`);
  }

  return $("a[href^='/']").toArray().map((a) => $(a).attr("href").split("#")[0]).filter((h) => h && !h.startsWith("/_next"));
}

// 1) sitemap e robots
const sm = await get("/sitemap.xml");
if (sm.res.status !== 200) error("/sitemap.xml", `risposta ${sm.res.status}`);
const sitemapPaths = [...sm.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
if (sitemapPaths.length === 0) error("/sitemap.xml", "sitemap vuota");

const robots = await get("/robots.txt");
if (robots.res.status !== 200) error("/robots.txt", `risposta ${robots.res.status}`);
else if (EXPECT_INDEXABLE) {
  if (/^\s*Disallow:\s*\/\s*$/im.test(robots.text)) error("/robots.txt", "blocca tutto il sito ma doveva essere indicizzabile");
  if (!/sitemap:/i.test(robots.text)) error("/robots.txt", "manca la riga Sitemap");
} else if (!/^\s*Disallow:\s*\/\s*$/im.test(robots.text)) error("/robots.txt", "non blocca il sito ma doveva essere noindex (test)");

// 2) pagine
const pages = [...new Set([...sitemapPaths, "/en", "/it"])];
const internalLinks = new Set();
for (const path of pages) {
  const { res, text } = await get(path);
  if (res.status !== 200) {
    error(path, `risposta ${res.status}, atteso 200`);
    continue;
  }
  const kind = path.split("/").filter(Boolean).length === 1 ? "list" : "article";
  for (const l of checkPage(path, kind, res, text)) internalLinks.add(l);
}

// 3) link interni rotti
for (const link of internalLinks) {
  if (pages.includes(link)) continue;
  const { res } = await get(link, { method: "HEAD" });
  if (res.status >= 400) error(link, `link interno rotto (${res.status})`);
}

// 4) vere risposte 404 (niente soft 404)
for (const p of ["/en/this-page-does-not-exist", "/it/pagina-inesistente", "/xx"]) {
  const { res } = await get(p);
  if (res.status !== 404) error(p, `risposta ${res.status}, atteso 404 vero (soft 404)`);
}

// 5) la home reindirizza alla lingua predefinita
const home = await get("/");
if (![301, 302, 307, 308].includes(home.res.status) || !(home.res.headers.get("location") ?? "").includes("/en")) error("/", "la radice non reindirizza a /en");

// 6) l'endpoint di rinnovo cache deve restare protetto
const rv = await get("/api/revalidate", { method: "POST" });
if (rv.res.status !== 401 && rv.res.status !== 503) error("/api/revalidate", `senza segreto risponde ${rv.res.status}, atteso 401`);
const rvGet = await get("/api/revalidate");
if (rvGet.res.status !== 405) error("/api/revalidate", `GET risponde ${rvGet.res.status}, atteso 405`);

// Esito
const lines = [];
lines.push(`## Controlli SEO tecnici`);
lines.push(`Pagine controllate: ${pages.length} · link interni: ${internalLinks.size} · modalità: ${EXPECT_INDEXABLE ? "indicizzabile" : "noindex (test)"}`);
lines.push("");
lines.push(errors.length ? `**❌ ${errors.length} errori**` : "**✅ Nessun errore**");
for (const e of errors) lines.push(`- ❌ \`${e.url}\` – ${e.msg}`);
if (warnings.length) lines.push("", `**⚠️ ${warnings.length} avvisi**`);
for (const w of warnings) lines.push(`- ⚠️ \`${w.url}\` – ${w.msg}`);
const out = lines.join("\n");
console.log(out);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, out + "\n\n");
process.exit(errors.length ? 1 : 0);
