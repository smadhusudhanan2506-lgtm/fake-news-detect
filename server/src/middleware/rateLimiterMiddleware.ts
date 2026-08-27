import rateLimit from 'express-rate-limit';
import { config } from '../config/env';

export const anonymousLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.rateLimitAnonymous,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please create an account or slow down.',
    },
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.rateLimitAuthenticated,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Request quota reached. Please wait a moment before submitting more verifications.',
    },
  },
});
