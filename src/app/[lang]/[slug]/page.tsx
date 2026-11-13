import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { getArticle, listAllArticleKeys } from "@/lib/articles";
import { SITE_URL, UI, isLang } from "@/lib/site";

type Props = { params: Promise<{ lang: string; slug: string }> };

// Pre-genera al build tutti gli articoli pubblicati: l'HTML arriva completo a Google e ai crawler AI.
export async function generateStaticParams() {
  const keys = await listAllArticleKeys();
  return keys.map(({ lang, slug }) => ({ lang, slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLang(lang)) return {};
  const article = await getArticle(lang, slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.meta_description,
    alternates: { canonical: `/${lang}/${slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.meta_description,
      url: `/${lang}/${slug}`,
      locale: lang === "it" ? "it_IT" : "en_US",
      publishedTime: article.published_at ?? undefined,
      modifiedTime: article.updated_at,
    },
  };
}

// IMPORTANTE per la SEO: params e dati si leggono FUORI da <Suspense>.
// Così notFound() viene deciso prima di inviare gli header e la risposta è un vero 404, non un "soft 404".
export default async function Page({ params }: Props) {
  const { lang, slug } = await params;
  if (!isLang(lang)) notFound();
  const article = await getArticle(lang, slug);
  if (!article) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.meta_description,
    inLanguage: lang,
    datePublished: article.published_at,
    dateModified: article.updated_at,
    mainEntityOfPage: `${SITE_URL}/${lang}/${slug}`,
  };

  return (
    <article>
      <p>
        <Link href={`/${lang}`}>← {UI[lang].back}</Link>
      </p>
      <h1>{article.title}</h1>
      <p className="meta">
        {UI[lang].published}:{" "}
        {article.published_at ? new Date(article.published_at).toISOString().slice(0, 10) : ""}
      </p>
      {/* ReactMarkdown non esegue HTML grezzo: contenuto sicuro per impostazione predefinita */}
      <ReactMarkdown>{article.body_md}</ReactMarkdown>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </article>
  );
}
