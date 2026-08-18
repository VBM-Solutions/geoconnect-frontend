import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { StudyFinderPlaceholder } from './StudyFinderPlaceholder';

describe('StudyFinderPlaceholder', () => {
  it("réserve l'interface sans simuler une recommandation métier", async () => {
    const onContinue = vi.fn();
    render(<StudyFinderPlaceholder onContinue={onContinue} />);

    expect(screen.getByRole('heading', { name: /de quelle étude/i })).toBeVisible();
    expect(screen.getAllByRole('combobox')).toHaveLength(2);
    expect(screen.getAllByRole('combobox')[0]).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: /décrire mon projet/i }));
    expect(onContinue).toHaveBeenCalledOnce();
  });
});
