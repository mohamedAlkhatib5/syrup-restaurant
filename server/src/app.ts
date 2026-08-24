import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { env } from './env.js';
import { logger } from './lib/logger.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { authRouter } from './routes/auth.js';
import { contactRouter } from './routes/contact.js';
import { categoriesRouter, menuRouter } from './routes/menu.js';
import { ordersRouter } from './routes/orders.js';
import { settingsRouter } from './routes/settings.js';
import { prisma } from './prisma.js';

export function createApp() {
  const app = express();

  // خلف وكيل عكسي، حتى تُقرأ عناوين IP الحقيقية في حدّ الطلبات.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  // قائمة سماح صريحة. لا wildcard مع credentials أبدًا.
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`Origin ${origin} is not allowed.`));
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use(pinoHttp({ logger }));

  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
      limit: env.RATE_LIMIT_MAX,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
    })
  );

  app.get('/api/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ok', database: 'up' });
    } catch {
      res.status(503).json({ status: 'degraded', database: 'down' });
    }
  });

  app.use('/api/settings', settingsRouter);
  app.use('/api/categories', categoriesRouter);
  app.use('/api/menu-items', menuRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/contact-messages', contactRouter);
  app.use('/api/auth', authRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
