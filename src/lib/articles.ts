"use cache";

import { cacheLife, cacheTag } from "next/cache";
import { supabase } from "./supabase";
import type { Lang } from "./site";

export type ArticleSummary = {
  slug: string;
  title: string;
  meta_description: string;
  published_at: string | null;
};

export type Article = ArticleSummary & {
  lang: Lang;
  body_md: string;
  updated_at: string;
};

// Se Supabase risponde con un errore lanciamo un'eccezione: così Next.js NON mette in cache una pagina vuota.

export async function listArticles(lang: Lang): Promise<ArticleSummary[]> {
  cacheLife("hours");
  cacheTag("articles");
  const { data, error } = await supabase
    .from("articles")
    .select("slug,title,meta_description,published_at")
    .eq("lang", lang)
    .order("published_at", { ascending: false });
  if (error) throw new Error(`listArticles: ${error.message}`);
  return data ?? [];
}

export async function getArticle(lang: Lang, slug: string): Promise<Article | null> {
  cacheLife("hours");
  cacheTag("articles", `article:${lang}:${slug}`);
  const { data, error } = await supabase
    .from("articles")
    .select("lang,slug,title,meta_description,body_md,published_at,updated_at")
    .eq("lang", lang)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`getArticle: ${error.message}`);
  return (data as Article | null) ?? null;
}

export async function listAllArticleKeys(): Promise<{ lang: Lang; slug: string; updated_at: string }[]> {
  cacheLife("hours");
  cacheTag("articles");
  const { data, error } = await supabase.from("articles").select("lang,slug,updated_at");
  if (error) throw new Error(`listAllArticleKeys: ${error.message}`);
  return (data ?? []) as { lang: Lang; slug: string; updated_at: string }[];
}
