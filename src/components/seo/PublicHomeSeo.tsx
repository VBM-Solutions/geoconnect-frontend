import { useEffect } from 'react';

const DESCRIPTION =
  "Décrivez votre projet et recevez les devis proposés par des bureaux d'études géotechniques qualifiés près de chez vous.";

function upsertMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([name, value]) => element?.setAttribute(name, value));
}

export function PublicHomeSeo() {
  useEffect(() => {
    document.documentElement.lang = 'fr';
    document.title = 'Étude de sol : demandez vos devis | Mon étude de sol.fr';

    upsertMeta('meta[name="description"]', { name: 'description', content: DESCRIPTION });
    upsertMeta('meta[name="robots"]', { name: 'robots', content: 'index, follow, max-image-preview:large' });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: document.title });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: DESCRIPTION });
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
    upsertMeta('meta[property="og:locale"]', { property: 'og:locale', content: 'fr_FR' });
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: '/brand/mon-etude-de-sol-logo.png' });
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });

    const structuredData = document.createElement('script');
    structuredData.type = 'application/ld+json';
    structuredData.dataset.publicHomeSeo = 'true';
    structuredData.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Mon étude de sol.fr',
      url: 'https://mon-etude-de-sol.fr/',
      inLanguage: 'fr-FR',
      description: DESCRIPTION,
    });
    document.head.appendChild(structuredData);

    return () => structuredData.remove();
  }, []);

  return null;
}
