// Legge i report Lighthouse e li scrive nel riepilogo dell'esecuzione GitHub.
import { appendFileSync, existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2] ?? "lighthouse-results";
if (!existsSync(dir)) {
  console.log("Nessun report Lighthouse trovato in", dir);
  process.exit(0);
}

const pct = (c) => Math.round(c.score * 100);
const icon = (n, ok) => (n >= ok ? "🟢" : n >= ok - 15 ? "🟠" : "🔴");

const lines = ["## Lighthouse (mobile)", "", "| Pagina | Prestazioni | Accessibilità | Best practice | SEO | LCP | CLS | TBT |", "|---|---:|---:|---:|---:|---:|---:|---:|"];
for (const f of readdirSync(dir).filter((f) => /\.report\.json$/.test(f))) {
  const j = JSON.parse(readFileSync(join(dir, f), "utf8"));
  const c = j.categories;
  const a = j.audits;
  const p = pct(c.performance), ac = pct(c.accessibility), b = pct(c["best-practices"]), s = pct(c.seo);
  lines.push(
    `| \`${new URL(j.finalUrl).pathname}\` | ${icon(p, 85)} ${p} | ${icon(ac, 90)} ${ac} | ${icon(b, 90)} ${b} | ${icon(s, 95)} ${s} | ${a["largest-contentful-paint"].displayValue} | ${a["cumulative-layout-shift"].displayValue} | ${a["total-blocking-time"].displayValue} |`,
  );
}
const out = lines.join("\n");
console.log(out);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, out + "\n\n");
