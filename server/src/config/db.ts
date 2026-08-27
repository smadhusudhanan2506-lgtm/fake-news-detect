import dns from 'dns';
import mongoose from 'mongoose';
import { config } from './env';
import { logger } from './logger';

export let isMongoConnected = false;

export const connectDatabase = async (): Promise<boolean> => {
  try {
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
    } catch {}

    mongoose.set('strictQuery', true);
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 6000,
      connectTimeoutMS: 6000,
    });
    isMongoConnected = true;
    logger.info(' Connected to MongoDB database successfully.');
    return true;
  } catch (error: any) {
    isMongoConnected = false;
    logger.warn(` MongoDB connection failed (${error.message}). Running with hybrid In-Memory fallback store for zero-friction local development.`);
    return false;
  }
};
