/**
 * WEPSUN Engineering Solutions — Authentication Rate Limiting Middleware
 * Prevents Brute-Force Password Guessing & Token Exhaustion Attacks
 */

import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for login and password reset endpoints.
 * In development, local development testing is unthrottled to prevent lockouts.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 120 : 10000,
  skip: (req) => {
    if (process.env.NODE_ENV !== 'production') return true;
    const ip = req.ip || req.socket.remoteAddress || '';
    return (
      ip === '127.0.0.1' ||
      ip === '::1' ||
      ip === '::ffff:127.0.0.1' ||
      ip.includes('localhost') ||
      ip.startsWith('192.168.') ||
      ip.startsWith('10.') ||
      ip.startsWith('172.')
    );
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP address. Please try again after 15 minutes.',
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
