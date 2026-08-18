import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BrandLogo } from './BrandLogo';

describe('BrandLogo', () => {
  it('charge le logo prioritaire avec ses dimensions', () => {
    render(<BrandLogo priority className="brand" />);
    const logo = screen.getByRole('img', { name: 'Mon étude de sol.fr' });
    expect(logo).toHaveAttribute('src', '/brand/mon-etude-de-sol-logo.png');
    expect(logo).toHaveAttribute('loading', 'eager');
    expect(logo).toHaveAttribute('fetchpriority', 'high');
    expect(logo).toHaveClass('brand');
  });

  it('diffère le chargement par défaut', () => {
    render(<BrandLogo />);
    expect(screen.getByRole('img')).toHaveAttribute('loading', 'lazy');
  });
});
