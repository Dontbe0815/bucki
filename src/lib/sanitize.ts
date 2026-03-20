/**
 * Input sanitization utilities using DOMPurify.
 * Provides functions to sanitize user input and prevent XSS attacks.
 * 
 * @module lib/sanitize
 */

import DOMPurify from 'dompurify';

/**
 * Default allowed tags for rich text input.
 * Only basic formatting tags are allowed.
 */
const DEFAULT_ALLOWED_TAGS = ['b', 'i', 'em', 'strong', 'u', 'br', 'p', 'span'];

/**
 * Default allowed attributes for rich text input.
 */
const DEFAULT_ALLOWED_ATTRS = ['class', 'style'];

/**
 * Sanitizes plain text input by removing all HTML tags.
 * Use this for regular text inputs like names, addresses, etc.
 * 
 * @param input - The input string to sanitize
 * @returns Sanitized plain text string
 * 
 * @example
 * const safeName = sanitizePlainText('<script>alert("xss")</script>John');
 * // Returns: 'John'
 */
export function sanitizePlainText(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Strip all HTML tags
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
}

/**
 * Sanitizes rich text input allowing basic HTML formatting.
 * Use this for textareas where some formatting is needed.
 * 
 * @param input - The input string to sanitize
 * @param options - Optional configuration for allowed tags and attributes
 * @returns Sanitized HTML string
 * 
 * @example
 * const safeHtml = sanitizeRichText('<p>Hello <b>World</b></p>');
 * // Returns: '<p>Hello <b>World</b></p>'
 * 
 * const cleanInput = sanitizeRichText('<script>alert("xss")</script><p>Safe</p>');
 * // Returns: '<p>Safe</p>'
 */
export function sanitizeRichText(
  input: string, 
  options?: {
    allowedTags?: string[];
    allowedAttrs?: string[];
  }
): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: options?.allowedTags || DEFAULT_ALLOWED_TAGS,
    ALLOWED_ATTR: options?.allowedAttrs || DEFAULT_ALLOWED_ATTRS,
  });
}

/**
 * Sanitizes a URL string to prevent javascript: and data: URL attacks.
 * 
 * @param url - The URL string to sanitize
 * @returns Sanitized URL or empty string if invalid/dangerous
 * 
 * @example
 * const safeUrl = sanitizeUrl('https://example.com');
 * // Returns: 'https://example.com'
 * 
 * const blockedUrl = sanitizeUrl('javascript:alert("xss")');
 * // Returns: ''
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }
  
  const trimmed = url.trim().toLowerCase();
  
  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  for (const protocol of dangerousProtocols) {
    if (trimmed.startsWith(protocol)) {
      return '';
    }
  }
  
  return url.trim();
}

/**
 * Sanitizes an email address.
 * 
 * @param email - The email string to sanitize
 * @returns Sanitized email or empty string if invalid
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return '';
  }
  
  // Remove any HTML and whitespace
  const cleaned = DOMPurify.sanitize(email, { ALLOWED_TAGS: [] }).trim();
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleaned)) {
    return '';
  }
  
  return cleaned;
}

/**
 * Sanitizes a phone number.
 * Only allows digits, spaces, hyphens, parentheses, and plus sign.
 * 
 * @param phone - The phone number string to sanitize
 * @returns Sanitized phone number
 */
export function sanitizePhone(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    return '';
  }
  
  // Remove any HTML first
  const cleaned = DOMPurify.sanitize(phone, { ALLOWED_TAGS: [] });
  
  // Only allow valid phone number characters
  return cleaned.replace(/[^0-9+\-\s()]/g, '').trim();
}

/**
 * Sanitizes a numeric input string.
 * 
 * @param value - The numeric string to sanitize
 * @returns Sanitized numeric string or empty string
 */
export function sanitizeNumeric(value: string): string {
  if (!value || typeof value !== 'string') {
    return '';
  }
  
  // Remove any HTML and non-numeric characters except decimal point and minus
  const cleaned = DOMPurify.sanitize(value, { ALLOWED_TAGS: [] });
  return cleaned.replace(/[^0-9.\-]/g, '');
}

/**
 * Sanitizes a postal code (German format: 5 digits).
 * 
 * @param postalCode - The postal code string to sanitize
 * @returns Sanitized postal code
 */
export function sanitizePostalCode(postalCode: string): string {
  if (!postalCode || typeof postalCode !== 'string') {
    return '';
  }
  
  // Remove any HTML and non-digit characters
  const cleaned = DOMPurify.sanitize(postalCode, { ALLOWED_TAGS: [] });
  return cleaned.replace(/[^0-9]/g, '').slice(0, 5);
}

/**
 * Sanitizes an object by sanitizing all string values.
 * Useful for sanitizing form data objects.
 * 
 * @param obj - The object to sanitize
 * @param mode - 'plain' for plain text, 'rich' for rich text
 * @returns New object with sanitized values
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  mode: 'plain' | 'rich' = 'plain'
): T {
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = mode === 'rich' 
        ? sanitizeRichText(value) 
        : sanitizePlainText(value);
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeObject(value as Record<string, unknown>, mode);
    } else {
      result[key] = value;
    }
  }
  
  return result as T;
}

/**
 * Creates a sanitized version of form data for safe storage/display.
 * 
 * @param data - Form data object
 * @param richTextFields - Array of field names that should allow rich text
 * @returns Sanitized form data
 */
export function sanitizeFormData<T extends Record<string, unknown>>(
  data: T,
  richTextFields: string[] = []
): T {
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      if (richTextFields.includes(key)) {
        result[key] = sanitizeRichText(value);
      } else {
        result[key] = sanitizePlainText(value);
      }
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeFormData(value as Record<string, unknown>, richTextFields);
    } else {
      result[key] = value;
    }
  }
  
  return result as T;
}

const sanitize = {
  sanitizePlainText,
  sanitizeRichText,
  sanitizeUrl,
  sanitizeEmail,
  sanitizePhone,
  sanitizeNumeric,
  sanitizePostalCode,
  sanitizeObject,
  sanitizeFormData,
};

export default sanitize;
