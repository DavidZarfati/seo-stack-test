import type { MetadataRoute } from "next";
import { listAllArticleKeys } from "@/lib/articles";
import { LANGS, SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const keys = await listAllArticleKeys();
  const home = LANGS.map((lang) => ({ url: `${SITE_URL}/${lang}` }));
  const articles = keys.map(({ lang, slug, updated_at }) => ({
    url: `${SITE_URL}/${lang}/${slug}`,
    lastModified: new Date(updated_at),
  }));
  return [...home, ...articles];
}
