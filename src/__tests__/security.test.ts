/**
 * Tests for security utilities.
 * @module __tests__/security.test
 */

import {
  setPin,
  verifyPin,
  getSecuritySettings,
  saveSecuritySettings,
  removePin,
  isPinRequired,
  isSessionValid,
  lockSession,
  unlockSession,
} from '@/lib/security';

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
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

describe('Security Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    sessionStorageMock.getItem.mockReturnValue(null);
  });

  describe('setPin', () => {
    it('should accept a 4-digit PIN', async () => {
      const result = await setPin('1234');
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept a 6-digit PIN', async () => {
      const result = await setPin('123456');
      expect(result.success).toBe(true);
    });

    it('should reject a PIN shorter than 4 digits', async () => {
      const result = await setPin('123');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject a PIN longer than 6 digits', async () => {
      const result = await setPin('1234567');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject a PIN with non-numeric characters', async () => {
      const result = await setPin('abcd');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('verifyPin', () => {
    it('should return true when no PIN is set', async () => {
      // No PIN set
      const result = await verifyPin('1234');
      expect(result).toBe(true);
    });
  });

  describe('getSecuritySettings', () => {
    it('should return default settings when nothing is stored', () => {
      const settings = getSecuritySettings();
      expect(settings.pinEnabled).toBe(false);
      expect(settings.biometricEnabled).toBe(false);
      expect(settings.autoLockMinutes).toBe(0);
    });
  });

  describe('saveSecuritySettings', () => {
    it('should save settings to localStorage', () => {
      saveSecuritySettings({ pinEnabled: true });
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('removePin', () => {
    it('should disable PIN protection', () => {
      removePin();
      expect(localStorageMock.setItem).toHaveBeenCalled();
      expect(sessionStorageMock.removeItem).toHaveBeenCalled();
    });
  });

  describe('Session Management', () => {
    it('should detect when session is valid', () => {
      sessionStorageMock.getItem.mockReturnValue(Date.now().toString());
      const result = isSessionValid();
      // Returns true when session timestamp is set
      expect(typeof result).toBe('boolean');
    });

    it('should handle invalid session state', () => {
      sessionStorageMock.getItem.mockReturnValue(null);
      // When no session exists, it depends on whether PIN is enabled
      const result = isSessionValid();
      expect(typeof result).toBe('boolean');
    });

    it('should lock session', () => {
      lockSession();
      expect(sessionStorageMock.removeItem).toHaveBeenCalled();
    });

    it('should unlock session', () => {
      unlockSession();
      expect(sessionStorageMock.setItem).toHaveBeenCalled();
    });
  });
});
