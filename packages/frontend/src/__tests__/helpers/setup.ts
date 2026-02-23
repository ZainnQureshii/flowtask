import '@testing-library/jest-dom/vitest';

// Polyfill ResizeObserver for jsdom (required by cmdk, radix, etc.)
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any;
