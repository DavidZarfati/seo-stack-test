import type { Metadata } from "next";
import { LANGS, SITE_URL, UI, isLang } from "@/lib/site";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: UI.en.siteName, template: `%s | ${UI.en.siteName}` },
};

export async function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  // Se la lingua non è valida la pagina chiamerà notFound(); qui usiamo "en" come ripiego.
  const htmlLang = isLang(lang) ? lang : "en";
  return (
    <html lang={htmlLang}>
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
