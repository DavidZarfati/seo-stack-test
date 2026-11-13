// Analisi Yoast (libreria open source yoastseo, solo per uso interno/CI: non viene mai inviata ai visitatori).
// Uso: node --env-file=.env.local scripts/yoast-check.mjs
import { appendFileSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createClient } from "@supabase/supabase-js";
import { marked } from "marked";

const require = createRequire(import.meta.url);
const { Paper, SeoAssessor, ContentAssessor } = require("yoastseo");
const researchers = {
  en: { Researcher: require("yoastseo/build/languageProcessing/languages/en/Researcher").default, locale: "en_US" },
  it: { Researcher: require("yoastseo/build/languageProcessing/languages/it/Researcher").default, locale: "it_IT" },
};

const cfg = JSON.parse(readFileSync(new URL("../seo.config.json", import.meta.url), "utf8")).yoast;
const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false },
});
const { data: articles, error } = await supabase
  .from("articles")
  .select("lang,slug,title,meta_description,body_md,focus_keyphrase")
  .order("lang")
  .order("slug");
if (error) {
  console.error("Errore Supabase:", error.message);
  process.exit(2);
}

// La larghezza in pixel del titolo la misura il semaforo SEO dedicato: qui la saltiamo per non dare risultati falsi.
const SKIP = [/^SEO title width/i];
const clean = (t) => String(t).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const label = (r) => clean(r.getText()).split(":")[0];
// Soglie di Yoast: 7 o più = buono (verde), 5-6 = da migliorare (arancione), meno = problema (rosso).
const status = (s) => (s >= 7 ? "🟢" : s >= 5 ? "🟠" : "🔴");

const rows = [];
let failed = false;

for (const a of articles) {
  const rs = researchers[a.lang];
  if (!rs) continue;
  const html = await marked.parse(a.body_md);
  const words = clean(html).split(" ").filter(Boolean).length;
  const paper = new Paper(html, {
    keyword: a.focus_keyphrase ?? "",
    title: a.title,
    description: a.meta_description,
    slug: a.slug,
    permalink: `${SITE}/${a.lang}/${a.slug}`,
    locale: rs.locale,
  });
  const researcher = new rs.Researcher(paper);

  const seo = new SeoAssessor(researcher, { locale: rs.locale });
  seo.assess(paper);
  const content = new ContentAssessor(researcher, { locale: rs.locale });
  content.assess(paper);

  const keep = (r) => !SKIP.some((re) => re.test(clean(r.getText())));
  const seoRes = seo.getValidResults().filter(keep);
  const contRes = content.getValidResults().filter(keep);
  const seoScore = a.focus_keyphrase ? seo.calculateOverallScore() : null;
  const contScore = content.calculateOverallScore();

  const problems = [...seoRes.map((r) => ["SEO", r]), ...contRes.map((r) => ["Leggibilità", r])]
    .filter(([, r]) => r.getScore() < 7)
    .map(([kind, r]) => `${status(r.getScore())} ${kind}: ${label(r)}`);

  rows.push({ a, words, seoScore, contScore, problems });

  const belowSeo = seoScore !== null && seoScore < cfg.seoMin;
  const belowRead = contScore < cfg.readabilityMin;
  const missingKeyphrase = !a.focus_keyphrase;
  if (cfg.mode === "enforce" && words >= cfg.minWordsForEnforce && (belowSeo || belowRead || missingKeyphrase)) failed = true;
}

const lines = [];
lines.push("## Analisi Yoast");
lines.push(`Modalità: **${cfg.mode}** (soglie: SEO ≥ ${cfg.seoMin}, leggibilità ≥ ${cfg.readabilityMin})`);
lines.push("");
lines.push("| Articolo | Parole | SEO | Leggibilità |");
lines.push("|---|---:|---:|---:|");
for (const r of rows) {
  lines.push(`| \`${r.a.lang}/${r.a.slug}\` | ${r.words} | ${r.seoScore ?? "senza parola chiave"} | ${r.contScore} |`);
}
for (const r of rows) {
  if (!r.problems.length) continue;
  const red = r.problems.filter((p) => p.startsWith("🔴")).length;
  const orange = r.problems.length - red;
  // <details> rende il report compatto nel riepilogo di GitHub.
  lines.push("", `<details><summary><code>${r.a.lang}/${r.a.slug}</code> – 🔴 ${red} · 🟠 ${orange}</summary>`, "");
  for (const p of r.problems) lines.push(`- ${p}`);
  lines.push("", "</details>");
}
lines.push("", failed ? "**❌ Sotto soglia: la PR è bloccata.**" : cfg.mode === "warn" ? "**ℹ️ Solo segnalazione: nessun blocco (modalità warn).**" : "**✅ Soglie rispettate.**");
const out = lines.join("\n");
console.log(out);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, out + "\n\n");
process.exit(failed ? 1 : 0);
