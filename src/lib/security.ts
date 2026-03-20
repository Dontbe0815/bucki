/**
 * Security Utilities for Bucki App.
 * PIN protection and authentication with proper cryptographic approach.
 * 
 * @module lib/security
 */

/**
 * Security settings interface for storing PIN configuration.
 */
export interface SecuritySettings {
  pinEnabled: boolean;
  pinHash?: string;
  salt?: string;
  biometricEnabled: boolean;
  autoLockMinutes: number;
  autoLockTime?: number; // Alias for autoLockMinutes (for compatibility)
  lastUnlockTime?: number;
  lastActivity?: number;
}

const SECURITY_KEY = 'bucki_security_settings';
const SESSION_KEY = 'bucki_session';

/**
 * Default security settings.
 */
const defaultSettings: SecuritySettings = {
  pinEnabled: false,
  biometricEnabled: false,
  autoLockMinutes: 0, // 0 = never
};

/**
 * Generates a cryptographically secure random salt.
 * Uses Web Crypto API for secure random number generation.
 * 
 * @param length - Length of the salt in bytes (default: 16)
 * @returns Hex-encoded salt string
 */
function generateSalt(length: number = 16): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Legacy salt for backward compatibility with old PIN hashes.
 * @deprecated Will be removed in future versions
 */
const LEGACY_SALT = 'bucki_salt_2024';

/**
 * Derives a key from a PIN using PBKDF2.
 * Uses Web Crypto API for secure key derivation.
 * 
 * @param pin - The PIN to derive from
 * @param salt - The salt to use for derivation
 * @param iterations - Number of PBKDF2 iterations (default: 100000)
 * @returns Derived key as hex string
 */
async function deriveKeyWithPBKDF2(
  pin: string, 
  salt: string, 
  iterations: number = 100000
): Promise<string> {
  // Check if Web Crypto API is available
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    try {
      // Encode PIN and salt
      const encoder = new TextEncoder();
      const pinBuffer = encoder.encode(pin);
      const saltBuffer = encoder.encode(salt);

      // Import PIN as key material
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        pinBuffer,
        'PBKDF2',
        false,
        ['deriveBits']
      );

      // Derive bits using PBKDF2
      const derivedBits = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: saltBuffer,
          iterations: iterations,
          hash: 'SHA-256',
        },
        keyMaterial,
        256 // 32 bytes = 256 bits
      );

      // Convert to hex string
      const hashArray = Array.from(new Uint8Array(derivedBits));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fall back to simple hash if PBKDF2 fails
    }
  }

  // Fallback: Simple SHA-256 hash (less secure but works everywhere)
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Gets the current security settings from localStorage.
 * 
 * @returns Current security settings
 */
export function getSecuritySettings(): SecuritySettings {
  try {
    const stored = localStorage.getItem(SECURITY_KEY);
    return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

/**
 * Saves security settings to localStorage.
 * 
 * @param settings - Partial settings to save
 */
export function saveSecuritySettings(settings: Partial<SecuritySettings>): void {
  const current = getSecuritySettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(SECURITY_KEY, JSON.stringify(updated));
}

/**
 * Sets a new PIN with proper cryptographic hashing.
 * 
 * @param pin - PIN to set (4-6 digits)
 * @returns Success status and optional error message
 */
export async function setPin(pin: string): Promise<{ success: boolean; error?: string }> {
  // Validate PIN format
  if (!pin || pin.length < 4 || pin.length > 6) {
    return { success: false, error: 'PIN muss 4-6 Ziffern haben' };
  }
  
  if (!/^\d+$/.test(pin)) {
    return { success: false, error: 'PIN darf nur Ziffern enthalten' };
  }
  
  // Generate new random salt
  const salt = generateSalt();
  
  // Derive key with PBKDF2
  const hash = await deriveKeyWithPBKDF2(pin, salt);
  
  saveSecuritySettings({
    pinEnabled: true,
    pinHash: hash,
    salt: salt,
  });
  
  return { success: true };
}

/**
 * Simple SHA-256 hash for maximum backward compatibility.
 * Used for legacy PIN verification.
 * 
 * @param data - Data to hash
 * @returns SHA-256 hash as hex string
 */
async function simpleSha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifies a PIN against the stored hash.
 * Supports multiple hash formats for backward compatibility:
 * 1. New: PBKDF2 with random salt
 * 2. Legacy PBKDF2 with static salt
 * 3. Legacy simple SHA-256 with static salt
 * 4. Plain PIN (for demo/reset scenarios)
 * 
 * @param pin - PIN to verify
 * @returns Whether the PIN is correct
 */
export async function verifyPin(pin: string): Promise<boolean> {
  const settings = getSecuritySettings();
  
  if (!settings.pinEnabled || !settings.pinHash) {
    return true; // No PIN required
  }
  
  // Method 1: If we have a stored salt, use the new PBKDF2 method
  if (settings.salt) {
    const hash = await deriveKeyWithPBKDF2(pin, settings.salt);
    if (hash === settings.pinHash) {
      return true;
    }
  }
  
  // Method 2: Try legacy PBKDF2 with static salt
  const legacyPbkdf2Hash = await deriveKeyWithPBKDF2(pin, LEGACY_SALT);
  if (legacyPbkdf2Hash === settings.pinHash) {
    // Migrate to new secure format on successful legacy login
    const newSalt = generateSalt();
    const newHash = await deriveKeyWithPBKDF2(pin, newSalt);
    saveSecuritySettings({
      pinHash: newHash,
      salt: newSalt,
    });
    return true;
  }
  
  // Method 3: Try simple SHA-256 with static salt (very old format)
  const legacySimpleHash = await simpleSha256(pin + LEGACY_SALT);
  if (legacySimpleHash === settings.pinHash) {
    // Migrate to new secure format
    const newSalt = generateSalt();
    const newHash = await deriveKeyWithPBKDF2(pin, newSalt);
    saveSecuritySettings({
      pinHash: newHash,
      salt: newSalt,
    });
    return true;
  }
  
  // Method 4: Try simple SHA-256 without salt (oldest format)
  const legacyNoSaltHash = await simpleSha256(pin);
  if (legacyNoSaltHash === settings.pinHash) {
    // Migrate to new secure format
    const newSalt = generateSalt();
    const newHash = await deriveKeyWithPBKDF2(pin, newSalt);
    saveSecuritySettings({
      pinHash: newHash,
      salt: newSalt,
    });
    return true;
  }
  
  return false;
}

/**
 * Removes PIN protection.
 */
export function removePin(): void {
  saveSecuritySettings({
    pinEnabled: false,
    pinHash: undefined,
    salt: undefined,
  });
  sessionStorage.removeItem(SESSION_KEY);
}

/**
 * Changes the PIN after verifying the old PIN.
 * 
 * @param oldPin - Current PIN
 * @param newPin - New PIN to set
 * @returns Success status and optional error message
 */
export async function changePin(oldPin: string, newPin: string): Promise<{ success: boolean; error?: string }> {
  const isValid = await verifyPin(oldPin);
  
  if (!isValid) {
    return { success: false, error: 'Falsche PIN' };
  }
  
  if (!newPin || newPin.length < 4 || newPin.length > 6) {
    return { success: false, error: 'PIN muss 4-6 Ziffern haben' };
  }
  
  if (!/^\d+$/.test(newPin)) {
    return { success: false, error: 'PIN darf nur Ziffern enthalten' };
  }
  
  const result = await setPin(newPin);
  return result;
}

/**
 * Performs a complete reset of all application data.
 * Use with caution - this is irreversible.
 */
export function forgotPinReset(): void {
  // Clear all localStorage data
  localStorage.clear();
  sessionStorage.clear();
  
  // Clear all databases (IndexedDB)
  if (typeof indexedDB !== 'undefined' && indexedDB.databases) {
    indexedDB.databases().then((dbs) => {
      dbs.forEach((db) => {
        if (db.name) {
          indexedDB.deleteDatabase(db.name);
        }
      });
    });
  }
}

/**
 * Resets ONLY the PIN without deleting application data.
 * This is useful when the user forgot their PIN but wants to keep their data.
 * After calling this, the user will need to set a new PIN.
 * 
 * @returns Always returns true
 */
export function resetPinOnly(): boolean {
  // Only clear security settings, preserve app data
  localStorage.removeItem(SECURITY_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  return true;
}

/**
 * Creates a new session after successful authentication.
 */
export function createSession(): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({
    createdAt: Date.now(),
    isValid: true,
  }));
  
  const settings = getSecuritySettings();
  if (settings.autoLockMinutes > 0) {
    saveSecuritySettings({ lastUnlockTime: Date.now(), lastActivity: Date.now() });
  }
}

/**
 * Checks if the current session is valid.
 * 
 * @returns Whether the session is valid
 */
export function isSessionValid(): boolean {
  const settings = getSecuritySettings();
  
  // No PIN required
  if (!settings.pinEnabled) {
    return true;
  }
  
  // Check session storage
  const sessionStr = sessionStorage.getItem(SESSION_KEY);
  if (!sessionStr) {
    return false;
  }
  
  try {
    const session = JSON.parse(sessionStr);
    if (!session.isValid) {
      return false;
    }
    
    // Check auto-lock based on last activity
    if (settings.autoLockMinutes > 0 && settings.lastActivity) {
      const elapsed = Date.now() - settings.lastActivity;
      const lockAfter = settings.autoLockMinutes * 60 * 1000;
      
      if (elapsed > lockAfter) {
        return false;
      }
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Locks the current session.
 */
export function lockSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

/**
 * Unlocks the session (after successful PIN verification).
 */
export function unlockSession(): void {
  createSession();
}

/**
 * Checks if PIN is required.
 * 
 * @returns Whether PIN is required
 */
export function isPinRequired(): boolean {
  const settings = getSecuritySettings();
  return settings.pinEnabled && !isSessionValid();
}

/**
 * Checks if a PIN has been set up.
 * This is different from isPinRequired - it checks if PIN protection exists at all.
 * 
 * @returns Whether PIN protection is configured
 */
export function isPinConfigured(): boolean {
  const settings = getSecuritySettings();
  return settings.pinEnabled && !!settings.pinHash;
}

/**
 * Updates the last activity timestamp.
 * Should be called on user interactions for auto-lock.
 */
export function updateLastActivity(): void {
  const settings = getSecuritySettings();
  if (settings.autoLockMinutes > 0) {
    saveSecuritySettings({ lastActivity: Date.now() });
  }
}

/**
 * Checks if biometric authentication is available.
 * 
 * @returns Whether biometric auth is available
 */
export function isBiometricAvailable(): boolean {
  return typeof window !== 'undefined' && 
    'PublicKeyCredential' in window &&
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function';
}

/**
 * Checks if biometric authentication is enabled.
 * 
 * @returns Whether biometric auth is enabled
 */
export function isBiometricEnabled(): boolean {
  const settings = getSecuritySettings();
  return settings.biometricEnabled && isBiometricAvailable();
}

/**
 * Requests biometric authentication.
 * Note: Full implementation requires WebAuthn setup.
 * 
 * @returns Whether biometric auth succeeded
 */
export async function requestBiometricAuth(): Promise<boolean> {
  if (!isBiometricAvailable()) {
    return false;
  }
  
  try {
    const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (!available) {
      return false;
    }
    
    // For a real implementation, you would use WebAuthn here
    // This is a simplified version that just checks availability
    return true;
  } catch {
    return false;
  }
}

/**
 * Formats auto-lock minutes into a human-readable string.
 * 
 * @param minutes - Minutes to format
 * @returns Formatted string
 */
export function formatAutoLockOption(minutes: number): string {
  if (minutes === 0) return 'Nie';
  if (minutes < 60) return `${minutes} Minuten`;
  const hours = Math.floor(minutes / 60);
  return `${hours} Stunde${hours > 1 ? 'n' : ''}`;
}

/**
 * Available auto-lock options.
 */
export const autoLockOptions = [
  { value: 0, label: 'Nie' },
  { value: 1, label: '1 Minute' },
  { value: 5, label: '5 Minuten' },
  { value: 15, label: '15 Minuten' },
  { value: 30, label: '30 Minuten' },
  { value: 60, label: '1 Stunde' },
];
