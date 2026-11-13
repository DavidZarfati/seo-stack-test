-- Dati FINTI per il test. Nessun contenuto reale.
insert into public.articles (lang, slug, title, meta_description, body_md, status, published_at) values
('en', 'how-a-test-pipeline-works',
 'How a Test Pipeline Works: A Simple Guide',
 'A short, fictional guide that explains how a content pipeline moves an article from draft to published page.',
 E'A content pipeline moves an article through clear steps.\n\n## Draft\nThe article is written and saved as a draft. Drafts are never visible to visitors.\n\n## Checks\nAutomatic checks review the title, the description and the readability.\n\n## Publish\nAfter a human approves it, the page goes live and search engines are notified.',
 'published', now()),
('en', 'why-server-rendering-helps-seo',
 'Why Server Rendering Helps SEO',
 'A fictional explanation of why pages that arrive as complete HTML are easier for search engines to read.',
 E'Search engines read the HTML they receive.\n\n## Complete HTML\nWhen the page arrives complete, the content is visible right away.\n\n## Speed\nLess JavaScript usually means a faster first paint.',
 'published', now()),
('it', 'come-funziona-una-pipeline-di-prova',
 'Come funziona una pipeline di prova: guida semplice',
 'Una breve guida di fantasia che spiega come una pipeline sposta un articolo da bozza a pagina pubblicata.',
 E'Una pipeline di contenuti porta un articolo attraverso passaggi chiari.\n\n## Bozza\nL''articolo viene scritto e salvato come bozza. Le bozze non sono mai visibili ai visitatori.\n\n## Controlli\nControlli automatici verificano titolo, descrizione e leggibilità.\n\n## Pubblicazione\nDopo l''approvazione di una persona, la pagina va online e i motori di ricerca vengono avvisati.',
 'published', now()),
('it', 'perche-il-rendering-lato-server-aiuta-la-seo',
 'Perché il rendering lato server aiuta la SEO',
 'Una spiegazione di fantasia sul perché le pagine che arrivano come HTML completo sono più facili da leggere.',
 E'I motori di ricerca leggono l''HTML che ricevono.\n\n## HTML completo\nQuando la pagina arriva completa, il contenuto è visibile subito.\n\n## Velocità\nMeno JavaScript di solito significa un primo caricamento più rapido.',
 'published', now()),
('en', 'draft-article-should-stay-hidden',
 'Draft Article That Must Stay Hidden',
 'This draft exists only to prove that unpublished articles are not exposed to visitors.',
 'If you can read this on the public site, the security rules are broken.',
 'draft', null);

-- Parole chiave principali (analisi Yoast)
update public.articles set focus_keyphrase='content pipeline' where lang='en' and slug='how-a-test-pipeline-works';
update public.articles set focus_keyphrase='server rendering' where lang='en' and slug='why-server-rendering-helps-seo';
update public.articles set focus_keyphrase='pipeline di prova' where lang='it' and slug='come-funziona-una-pipeline-di-prova';
update public.articles set focus_keyphrase='rendering lato server' where lang='it' and slug='perche-il-rendering-lato-server-aiuta-la-seo';
