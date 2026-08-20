import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LandingSections } from './LandingSections';

describe('LandingSections', () => {
  it('affiche les trois sections et transmet la mission choisie', async () => {
    const onQuoteRequest = vi.fn();
    const user = userEvent.setup();
    render(<LandingSections onQuoteRequest={onQuoteRequest} />);

    expect(screen.getByRole('heading', { name: /votre étude de sol/i })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Les études que nous proposons' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Les questions que vous vous posez' })).toBeVisible();
    expect(screen.getByText('Documents centralisés')).toBeVisible();

    const g2Card = screen.getByRole('heading', { name: /G2 AVP/ }).closest('article');
    expect(g2Card).not.toBeNull();
    await user.click(within(g2Card!).getByRole('button', { name: 'Demander mon devis' }));
    expect(onQuoteRequest).toHaveBeenCalledWith('G2_AVP');
  });

  it('ouvre une demande sans présélection depuis les boutons généraux', async () => {
    const onQuoteRequest = vi.fn();
    const user = userEvent.setup();
    render(<LandingSections onQuoteRequest={onQuoteRequest} />);

    const buttons = screen.getAllByRole('button', { name: 'Demander mon devis' });
    await user.click(buttons[0]);
    await user.click(buttons[1]);
    await user.click(buttons.at(-1)!);
    expect(onQuoteRequest).toHaveBeenCalledTimes(3);
    expect(onQuoteRequest).toHaveBeenNthCalledWith(1);
    expect(onQuoteRequest).toHaveBeenNthCalledWith(2);
    expect(onQuoteRequest).toHaveBeenNthCalledWith(3);
  });

  it('n’affiche qu’une réponse et change la question sélectionnée', async () => {
    const user = userEvent.setup();
    render(<LandingSections onQuoteRequest={vi.fn()} />);

    const firstQuestion = screen.getByRole('button', { name: /qui réalisera mon étude de sol/i });
    const secondQuestion = screen.getByRole('button', { name: /comment se passe la prise de rendez-vous/i });
    expect(firstQuestion).toHaveAttribute('aria-expanded', 'true');
    const firstAnswer = screen.getByText(/système de notation/i);
    const secondAnswer = screen.getByText(/informations détaillées du bureau d’étude/i);
    expect(firstAnswer.closest('[aria-hidden]')).toHaveAttribute('aria-hidden', 'false');
    expect(secondAnswer.closest('[aria-hidden]')).toHaveAttribute('aria-hidden', 'true');

    await user.click(secondQuestion);

    expect(firstQuestion).toHaveAttribute('aria-expanded', 'false');
    expect(secondQuestion).toHaveAttribute('aria-expanded', 'true');
    expect(firstAnswer.closest('[aria-hidden]')).toHaveAttribute('aria-hidden', 'true');
    expect(secondAnswer.closest('[aria-hidden]')).toHaveAttribute('aria-hidden', 'false');
  });

  it('recentre la carte sélectionnée sans imposer de snap au scroll', async () => {
    const user = userEvent.setup();
    render(<LandingSections onQuoteRequest={vi.fn()} />);
    const cards = screen.getAllByRole('article');
    const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView');

    await user.click(within(cards[1]).getByRole('button', { name: /afficher G0/i }));
    await user.click(within(cards.at(-1)!).getByRole('button', { name: /afficher G5/i }));

    expect(scrollIntoView).toHaveBeenNthCalledWith(1, { behavior: 'smooth', block: 'nearest', inline: 'center' });
    expect(scrollIntoView.mock.instances[0]).toBe(cards[1]);
    expect(scrollIntoView).toHaveBeenNthCalledWith(2, { behavior: 'smooth', block: 'nearest', inline: 'center' });
    expect(scrollIntoView.mock.instances[1]).toBe(cards.at(-1));
    expect(screen.getByLabelText("Types d'études")).not.toHaveClass('snap-x', 'snap-mandatory');
    expect(screen.queryByRole('button', { name: /études suivantes/i })).toBeNull();
  });
});
