/**
 * Simple in-memory rate limiter for API routes.
 * Limits requests per IP address within a time window.
 * 
 * @module lib/rate-limit
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  /** Maximum number of requests allowed per window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  retryAfter: number;
}

/**
 * In-memory rate limit store.
 * Maps IP addresses to their request counts and reset times.
 */
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Cleans up expired entries from the rate limit store.
 * Called periodically to prevent memory leaks.
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(ip);
    }
  }
}

// Clean up every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
}

/**
 * Checks if a request from the given IP should be allowed.
 * 
 * @param ip - The IP address to check
 * @param config - Rate limit configuration
 * @returns Rate limit result with success status and remaining requests
 */
export function checkRateLimit(ip: string, config: RateLimitConfig): RateLimitResult {
  const { maxRequests, windowMs } = config;
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetTime) {
    // New window
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(ip, newEntry);
    return { 
      success: true, 
      remaining: maxRequests - 1, 
      resetTime: newEntry.resetTime,
      retryAfter: 0 
    };
  }

  if (entry.count >= maxRequests) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return { 
      success: false, 
      remaining: 0, 
      resetTime: entry.resetTime,
      retryAfter 
    };
  }

  // Increment count
  entry.count++;
  return { 
    success: true, 
    remaining: maxRequests - entry.count, 
    resetTime: entry.resetTime,
    retryAfter: 0 
  };
}

/**
 * Creates rate limit headers for HTTP responses.
 * 
 * @param result - Rate limit result
 * @param config - Rate limit configuration
 * @returns Headers map
 */
export function createRateLimitHeaders(
  result: RateLimitResult, 
  config: RateLimitConfig
): Map<string, string> {
  const headers = new Map<string, string>();
  headers.set('X-RateLimit-Limit', config.maxRequests.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', result.resetTime.toString());
  
  if (!result.success) {
    headers.set('Retry-After', result.retryAfter.toString());
  }
  
  return headers;
}

/**
 * Creates a rate limiter instance with the specified configuration.
 * 
 * @param config - Rate limit configuration
 * @returns Object with limit function
 * 
 * @example
 * ```typescript
 * const limiter = createRateLimiter({ maxRequests: 10, windowMs: 60000 });
 * const { success, remaining } = limiter.limit(request.ip);
 * if (!success) {
 *   return new Response('Too many requests', { status: 429 });
 * }
 * ```
 */
export function createRateLimiter(config: RateLimitConfig) {
  return {
    limit: (ip: string): RateLimitResult => checkRateLimit(ip, config),
  };
}

/**
 * Default rate limiter for API routes.
 * 10 requests per minute per IP.
 */
export const defaultRateLimiter = createRateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
});

/**
 * Stricter rate limiter for sensitive operations.
 * 5 requests per minute per IP.
 */
export const strictRateLimiter = createRateLimiter({
  maxRequests: 5,
  windowMs: 60 * 1000,
});
