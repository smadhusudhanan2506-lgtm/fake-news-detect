import winston from 'winston';
import { config } from './env';

const sanitizeFormat = winston.format((info) => {
  if (typeof info.message === 'string') {
    info.message = info.message
      .replace(/Bearer\s+[A-Za-z0-9-_=.]+/gi, 'Bearer [REDACTED]')
      .replace(/password['"]?\s*[:=]\s*['"]?[^'",\s]+/gi, 'password: [REDACTED]')
      .replace(/apiKey['"]?\s*[:=]\s*['"]?[^'",\s]+/gi, 'apiKey: [REDACTED]');
  }
  return info;
});

export const logger = winston.createLogger({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    sanitizeFormat(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'factcheck-ai-backend' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        sanitizeFormat(),
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          const metaStr = Object.keys(meta).length > 1 ? ` ${JSON.stringify(meta)}` : '';
          return `[${timestamp}] [${level}]: ${message}${metaStr}`;
        })
      ),
    }),
  ],
});
