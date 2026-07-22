import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, renderHook, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ToastProvider, useToast } from './ToastContext';

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(ToastProvider, null, children);

function ToastTrigger({ type = 'success' }: { type?: 'success' | 'error' | 'info' }) {
  const { toastSuccess, toastError, toastInfo } = useToast();
  const showToast = () => {
    if (type === 'error') toastError('Message erreur');
    else if (type === 'info') toastInfo('Message info');
    else toastSuccess('Message succes');
  };

  return <button onClick={showToast}>Afficher</button>;
}

afterEach(() => {
  vi.useRealTimers();
});

describe('useToast', () => {
  it('lève une erreur si utilisé hors du ToastProvider', () => {
    expect(() => renderHook(() => useToast())).toThrow(
      'useToast must be used within a ToastProvider'
    );
  });

  it('expose toastSuccess, toastError, toastInfo', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    expect(typeof result.current.toastSuccess).toBe('function');
    expect(typeof result.current.toastError).toBe('function');
    expect(typeof result.current.toastInfo).toBe('function');
  });
});

describe('ToastProvider', () => {
  it('toastSuccess ne lève pas d\'exception', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    expect(() => act(() => result.current.toastSuccess('Opération réussie'))).not.toThrow();
  });

  it('toastError ne lève pas d\'exception', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    expect(() => act(() => result.current.toastError('Une erreur est survenue'))).not.toThrow();
  });

  it('toastInfo ne lève pas d\'exception', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    expect(() => act(() => result.current.toastInfo('Information'))).not.toThrow();
  });

  it('plusieurs toasts s\'accumulent sans erreur', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    expect(() =>
      act(() => {
        result.current.toastSuccess('OK 1');
        result.current.toastError('KO');
        result.current.toastInfo('Info');
      })
    ).not.toThrow();
  });

  it('ferme un toast au clic sur le bouton de fermeture', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    );

    await user.click(screen.getByRole('button', { name: 'Afficher' }));
    expect(screen.getByText('Message succes')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '' }));
    expect(screen.queryByText('Message succes')).not.toBeInTheDocument();
  });

  it('retire automatiquement un toast apres le delai', () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <ToastTrigger type="info" />
      </ToastProvider>
    );

    act(() => {
      screen.getByRole('button', { name: 'Afficher' }).click();
    });
    expect(screen.getByText('Message info')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.queryByText('Message info')).not.toBeInTheDocument();
  });
});


