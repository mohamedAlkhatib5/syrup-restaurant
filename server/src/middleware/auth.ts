import type { NextFunction, Request, Response } from 'express';

import { forbidden, unauthorized } from '../lib/errors.js';
import { verifyAccessToken, type AccessPayload } from '../lib/jwt.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AccessPayload;
    }
  }
}

function readToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;

  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
}

/** يقرأ المستخدم إن وُجد، ولا يمنع الطلب إن لم يوجد. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = readToken(req);

  if (token) {
    try {
      req.user = verifyAccessToken(token);
    } catch {
      // رمز فاسد على مسار عام: نتجاهله ونعامله كضيف.
    }
  }

  next();
}

/** يمنع الطلب ما لم يكن المستخدم مُصادقًا. */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = readToken(req);
  if (!token) throw unauthorized();

  req.user = verifyAccessToken(token);
  next();
}

/** يمنع الطلب ما لم يكن للمستخدم الدور المطلوب. */
export function requireRole(...roles: Array<AccessPayload['role']>) {
  return (req: Request, res: Response, next: NextFunction) => {
    requireAuth(req, res, () => {
      if (!req.user || !roles.includes(req.user.role)) {
        next(forbidden());
        return;
      }
      next();
    });
  };
}
