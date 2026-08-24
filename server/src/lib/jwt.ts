import { createHash, randomBytes } from 'node:crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';

import { env } from '../env.js';
import { unauthorized } from './errors.js';

export type AccessPayload = {
  sub: string;
  role: 'customer' | 'admin';
};

export function signAccessToken(payload: AccessPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL,
    issuer: 'syrup-api',
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, { issuer: 'syrup-api' });

    if (typeof decoded === 'string' || !decoded.sub) {
      throw unauthorized('Malformed token.');
    }

    return { sub: String(decoded.sub), role: (decoded as AccessPayload).role };
  } catch {
    throw unauthorized('Your session has expired. Please sign in again.');
  }
}

/**
 * رمز التجديد قيمة عشوائية لا JWT.
 *
 * السبب: يجب أن يكون قابلًا للإبطال فورًا من قاعدة البيانات، وهو ما
 * لا يوفّره JWT عديم الحالة. نخزّن تجزئته فقط حتى لا يكون تسريب
 * قاعدة البيانات كافيًا لانتحال جلسة.
 */
export function createRefreshToken() {
  const token = randomBytes(48).toString('base64url');
  return { token, tokenHash: hashRefreshToken(token) };
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
