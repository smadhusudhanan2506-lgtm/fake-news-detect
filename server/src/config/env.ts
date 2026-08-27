import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'factcheck_super_secret_jwt_key_2026_production',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/factcheck_ai',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  googleFactCheckApiKey: process.env.GOOGLE_FACT_CHECK_API_KEY || '',
  newsApiKey: process.env.NEWS_API_KEY || '',
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || 'factcheck-ai-app',
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
  firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
  rateLimitAnonymous: parseInt(process.env.RATE_LIMIT_ANONYMOUS || '60', 10),
  rateLimitAuthenticated: parseInt(process.env.RATE_LIMIT_AUTHENTICATED || '300', 10),
  rateLimitModerator: parseInt(process.env.RATE_LIMIT_MODERATOR || '1000', 10),
};
