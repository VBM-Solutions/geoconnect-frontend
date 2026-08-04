import React from 'react';

const FORBIDDEN_NUMBER_KEYS = new Set(['-', '+', 'e', 'E', '.', ',']);

export function preventInvalidPositiveIntegerKey(event: React.KeyboardEvent<HTMLInputElement>) {
  const replacesCurrentValue = event.currentTarget.selectionStart === 0
    && event.currentTarget.selectionEnd === event.currentTarget.value.length;
  const startsWithZero = event.key === '0'
    && (event.currentTarget.value.length === 0 || replacesCurrentValue);

  if (FORBIDDEN_NUMBER_KEYS.has(event.key) || startsWithZero) {
    event.preventDefault();
  }
}

export function preventInvalidPositiveIntegerPaste(event: React.ClipboardEvent<HTMLInputElement>) {
  const pastedValue = event.clipboardData.getData('text').trim();
  if (!/^[1-9]\d*$/.test(pastedValue)) {
    event.preventDefault();
  }
}
