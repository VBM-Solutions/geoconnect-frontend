import '@testing-library/jest-dom';
import { vi } from 'vitest';

if (!Element.prototype.scrollIntoView) {
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
	configurable: true,
	value: vi.fn(),
  });
}

