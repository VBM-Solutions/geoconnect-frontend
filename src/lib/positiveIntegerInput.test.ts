import { describe, expect, it, vi } from 'vitest';
import type React from 'react';
import {
  preventInvalidPositiveIntegerKey,
  preventInvalidPositiveIntegerPaste,
} from './positiveIntegerInput';

function keyboardEvent(key: string, value: string, selectionStart: number | null, selectionEnd: number | null) {
  const preventDefault = vi.fn();
  const event = {
    key,
    currentTarget: { value, selectionStart, selectionEnd },
    preventDefault,
  } as unknown as React.KeyboardEvent<HTMLInputElement>;

  return { event, preventDefault };
}

function pasteEvent(value: string) {
  const preventDefault = vi.fn();
  const event = {
    clipboardData: { getData: vi.fn().mockReturnValue(value) },
    preventDefault,
  } as unknown as React.ClipboardEvent<HTMLInputElement>;

  return { event, preventDefault };
}

describe('positiveIntegerInput', () => {
  it.each(['-', '+', 'e', 'E', '.', ','])('bloque la touche interdite %s', key => {
    const { event, preventDefault } = keyboardEvent(key, '12', 1, 1);

    preventInvalidPositiveIntegerKey(event);

    expect(preventDefault).toHaveBeenCalledOnce();
  });

  it('bloque zéro lorsque le champ est vide', () => {
    const { event, preventDefault } = keyboardEvent('0', '', 0, 0);

    preventInvalidPositiveIntegerKey(event);

    expect(preventDefault).toHaveBeenCalledOnce();
  });

  it('bloque zéro lorsque toute la valeur est remplacée', () => {
    const { event, preventDefault } = keyboardEvent('0', '12', 0, 2);

    preventInvalidPositiveIntegerKey(event);

    expect(preventDefault).toHaveBeenCalledOnce();
  });

  it.each([
    ['une touche numérique valide', '1', '', 0, 0],
    ['zéro après un chiffre', '0', '12', 2, 2],
    ['zéro avec une sélection partielle', '0', '12', 0, 1],
    ['une sélection indisponible', '1', '12', null, null],
  ])('autorise %s', (_label, key, value, selectionStart, selectionEnd) => {
    const { event, preventDefault } = keyboardEvent(key, value, selectionStart, selectionEnd);

    preventInvalidPositiveIntegerKey(event);

    expect(preventDefault).not.toHaveBeenCalled();
  });

  it.each(['1', '42', ' 7 '])('autorise le collage de l’entier positif %s', value => {
    const { event, preventDefault } = pasteEvent(value);

    preventInvalidPositiveIntegerPaste(event);

    expect(preventDefault).not.toHaveBeenCalled();
  });

  it.each(['', '0', '-1', '1.5', '1e2', 'abc'])('bloque le collage invalide %s', value => {
    const { event, preventDefault } = pasteEvent(value);

    preventInvalidPositiveIntegerPaste(event);

    expect(preventDefault).toHaveBeenCalledOnce();
  });
});
