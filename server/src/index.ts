import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app';
import { config } from './config/env';
import { logger } from './config/logger';
import { connectDatabase } from './config/db';
import { setupChatWebSocket } from './websocket/chatSocket';
import { seedInitialData } from './seeds/seed';

const startServer = async () => {
  try {
    // 1. Connect to Database (with memory store fallback)
    await connectDatabase();

    // 2. Seed default data into memory/DB
    await seedInitialData();

    // 3. Create Express App & HTTP Server
    const app = createApp();
    const server = http.createServer(app);

    // 4. Initialize Socket.IO Server
    const io = new SocketIOServer(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    setupChatWebSocket(io);

    // 5. Start listening
    server.listen(config.port, () => {
      logger.info(`=======================================================`);
      logger.info(` FactCheck AI Server running on http://localhost:${config.port}`);
      logger.info(` REST API: http://localhost:${config.port}/api`);
      logger.info(` WebSocket: ws://localhost:${config.port}/ws/chat`);
      logger.info(` Environment: ${config.nodeEnv}`);
      logger.info(` Tagline: "Verify Before You Believe."`);
      logger.info(`=======================================================`);
    });
  } catch (err: any) {
    logger.error(`Failed to start FactCheck AI server: ${err.message}`);
    process.exit(1);
  }
};

startServer();
