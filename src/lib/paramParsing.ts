/**
 * Type-safe parameter parsing utilities
 */

/**
 * Safely parse integer from string with default
 */
export function parseIntSafe(value: string | null | undefined, defaultValue: number = 0, min?: number, max?: number): number {
  if (!value) return defaultValue;
  
  const parsed = parseInt(value, 10);
  
  if (isNaN(parsed)) {
    return defaultValue;
  }
  
  if (min !== undefined && parsed < min) {
    return min;
  }
  
  if (max !== undefined && parsed > max) {
    return max;
  }
  
  return parsed;
}

/**
 * Safely parse float from string
 */
export function parseFloatSafe(value: string | null | undefined, defaultValue: number = 0, min?: number, max?: number): number {
  if (!value) return defaultValue;
  
  const parsed = parseFloat(value);
  
  if (isNaN(parsed)) {
    return defaultValue;
  }
  
  if (min !== undefined && parsed < min) {
    return min;
  }
  
  if (max !== undefined && parsed > max) {
    return max;
  }
  
  return parsed;
}

/**
 * Safely parse boolean from string
 */
export function parseBooleanSafe(value: string | null | undefined, defaultValue: boolean = false): boolean {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Validate and parse date string
 */
export function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  
  try {
    const date = new Date(value);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return null;
    }
    return date;
  } catch {
    return null;
  }
}

/**
 * Extract string param with validation
 */
export function getStringParam(params: URLSearchParams, key: string, options?: { max?: number; min?: number; required?: boolean }): string | null {
  const value = params.get(key);
  
  if (!value && options?.required) {
    throw new Error(`Missing required parameter: ${key}`);
  }
  
  if (value) {
    if (options?.max && value.length > options.max) {
      throw new Error(`Parameter ${key} exceeds max length of ${options.max}`);
    }
    if (options?.min && value.length < options.min) {
      throw new Error(`Parameter ${key} is below min length of ${options.min}`);
    }
  }
  
  return value;
}

/**
 * Input sanitization - remove potentially dangerous characters
 */
export function sanitizeString(input: string, maxLength: number = 5000): string {
  return input
    .slice(0, maxLength)
    .trim()
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g, ''); // Remove control characters
}

/**
 * Sanitize HTML - basic protection against XSS
 */
export function sanitizeHtml(input: string, maxLength: number = 5000): string {
  const sanitized = sanitizeString(input, maxLength);
  return sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Validate email format (basic)
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Normalize email
 */
export function normalizeEmail(email: string): string {
  return sanitizeString(email).toLowerCase().trim();
}
