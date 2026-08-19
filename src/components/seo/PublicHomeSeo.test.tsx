import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { PublicHomeSeo } from './PublicHomeSeo';

describe('PublicHomeSeo', () => {
  afterEach(() => {
    document.head.querySelectorAll('[data-public-home-seo]').forEach((element) => element.remove());
  });

  it('définit les métadonnées françaises et les données structurées', () => {
    document.head.querySelector('meta[name="description"]')?.remove();
    const { unmount } = render(<PublicHomeSeo />);

    expect(document.documentElement.lang).toBe('fr');
    expect(document.title).toContain('Mon étude de sol.fr');
    expect(document.head.querySelector('meta[name="description"]')).toHaveAttribute('content', expect.stringContaining('bureaux'));
    expect(document.head.querySelector('meta[property="og:locale"]')).toHaveAttribute('content', 'fr_FR');
    const structuredData = document.head.querySelector<HTMLScriptElement>('script[data-public-home-seo="true"]');
    expect(JSON.parse(structuredData?.text ?? '{}')).toMatchObject({ '@type': 'WebSite', inLanguage: 'fr-FR' });

    unmount();
    expect(document.head.querySelector('script[data-public-home-seo="true"]')).toBeNull();
  });
});
