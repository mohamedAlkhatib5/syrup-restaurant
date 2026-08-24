import { createApp } from './app.js';
import { env } from './env.js';
import { logger } from './lib/logger.js';
import { prisma } from './prisma.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`Syrup API listening on http://localhost:${env.PORT}`);
});

async function shutdown(signal: string) {
  logger.info({ signal }, 'shutting down');

  server.close(() => {
    void prisma.$disconnect().then(() => process.exit(0));
  });

  // لا ننتظر إلى الأبد إن تعلّق اتصال.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
