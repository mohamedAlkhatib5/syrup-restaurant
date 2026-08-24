import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';

import { env } from '../env.js';
import { AppError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: { code: 'not_found', message: `No route matches ${req.method} ${req.path}` },
  });
}

/** نقطة واحدة تُحوّل كل خطأ إلى نفس شكل الاستجابة. */
export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (error instanceof AppError) {
    res.status(error.status).json({
      error: { code: error.code, message: error.message, details: error.details },
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      res.status(409).json({
        error: { code: 'conflict', message: 'That record already exists.' },
      });
      return;
    }

    if (error.code === 'P2025') {
      res.status(404).json({ error: { code: 'not_found', message: 'Resource not found.' } });
      return;
    }
  }

  logger.error({ err: error }, 'unhandled error');

  res.status(500).json({
    error: {
      code: 'internal_error',
      // لا نسرّب تفاصيل داخلية في الإنتاج.
      message: env.isProduction
        ? 'Something went wrong on our side.'
        : error instanceof Error
          ? error.message
          : String(error),
    },
  });
}
