/**
 * WEPSUN Engineering Solutions — Authentication Rate Limiting Middleware
 * Prevents Brute-Force Password Guessing & Token Exhaustion Attacks
 */

import rateLimit from 'express-rate-limit';

/**
 * Strict rate limiter for login and password reset endpoints (10 requests per 15 minutes per IP)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 1000 : 20, // 20 attempts per 15m in dev/prod
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts from this IP address. Please try again after 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

/**
 * General API limiter (100 requests per minute)
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'test' ? 5000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'API rate limit exceeded. Please throttle requests.',
    code: 'API_RATE_LIMIT_EXCEEDED',
  },
});
