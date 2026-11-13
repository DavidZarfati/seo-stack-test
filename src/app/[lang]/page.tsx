import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listArticles } from "@/lib/articles";
import { UI, isLang } from "@/lib/site";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return {
    // Il template del layout non si applica alla pagina dello stesso livello: il nome del sito va aggiunto qui.
    title: `${UI[lang].listTitle} | ${UI[lang].siteName}`,
    description: UI[lang].listIntro,
    alternates: {
      canonical: `/${lang}`,
      languages: { en: "/en", it: "/it", "x-default": "/en" },
    },
  };
}

// params letti fuori da <Suspense>: una lingua non valida produce un vero 404.
export default async function Page({ params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const articles = await listArticles(lang);
  return (
    <>
      <h1>{UI[lang].listTitle}</h1>
      <p>{UI[lang].listIntro}</p>
      <ul className="list">
        {articles.map((a) => (
          <li key={a.slug}>
            <h2>
              <Link href={`/${lang}/${a.slug}`}>{a.title}</Link>
            </h2>
            <p>{a.meta_description}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
