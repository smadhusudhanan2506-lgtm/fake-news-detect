import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

export const createApp = () => {
  const app = express();

  // Security & Middleware
  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  app.use(cors({ origin: '*', credentials: true }));
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));
  app.use(morgan('dev'));

  // Health check
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      app: 'FactCheck AI Platform API',
      version: '1.0.0',
      tagline: 'Verify Before You Believe.',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API routes
  app.use('/api', routes);

  // Serve static web-preview frontend
  const webPreviewPath = path.join(__dirname, '../../web-preview');
  app.use(express.static(webPreviewPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/ws')) {
      return next();
    }
    res.sendFile(path.join(webPreviewPath, 'index.html'));
  });

  // 404 handler for API routes
  app.use('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'ENDPOINT_NOT_FOUND',
        message: `Cannot ${req.method} ${req.originalUrl}`,
      },
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
};
