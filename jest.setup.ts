/**
 * Jest setup file.
 * Imports testing utilities and configures global test environment.
 */

import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Polyfill TextEncoder/TextDecoder for Node.js
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof globalThis.TextDecoder;

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    };
  },
  usePathname() {
    return '/';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme() {
    return {
      theme: 'light',
      setTheme: jest.fn(),
    };
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock,
});

// Mock crypto.subtle for security tests
const subtleMock = {
  digest: jest.fn().mockImplementation(async () => {
    return new ArrayBuffer(32);
  }),
  importKey: jest.fn().mockImplementation(async () => ({})),
  deriveBits: jest.fn().mockImplementation(async () => {
    return new ArrayBuffer(32);
  }),
};

Object.defineProperty(window, 'crypto', {
  value: {
    subtle: subtleMock,
    getRandomValues: jest.fn().mockImplementation((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
  },
});
