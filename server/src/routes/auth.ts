import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

import { env } from '../env.js';
import { conflict, unauthorized } from '../lib/errors.js';
import { createRefreshToken, hashRefreshToken, signAccessToken } from '../lib/jwt.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { prisma } from '../prisma.js';

export const authRouter = Router();

const REFRESH_COOKIE = 'syrup_refresh';

/**
 * رمز التجديد يُرسل في كوكي httpOnly.
 *
 * السبب: أي ثغرة XSS تستطيع قراءة localStorage، ولا تستطيع قراءة كوكي
 * httpOnly. رمز الوصول قصير العمر يبقى في ذاكرة الواجهة فقط.
 * SameSite=strict يمنع أيضًا تنفيذ الطلب من موقع آخر (CSRF).
 */
function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'strict' as const,
    path: '/api/auth',
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  };
}

// محاولات الدخول محدودة: بلا هذا يصبح تخمين كلمات المرور مجانيًا.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { code: 'too_many_requests', message: 'Too many attempts. Try again later.' } },
});

const publicUser = (user: { id: string; fullName: string; email: string; phone: string; role: string }) => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  role: user.role,
});

async function issueSession(userId: string, role: 'customer' | 'admin') {
  const { token, tokenHash } = createRefreshToken();

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
    },
  });

  return { refreshToken: token, accessToken: signAccessToken({ sub: userId, role }) };
}

const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(255),
  phone: z.string().trim().regex(/^\+?[\d\s-]{7,20}$/, 'Enter a reachable phone number.'),
  password: z.string().min(8, 'Use at least 8 characters.').max(200),
});

authRouter.post(
  '/register',
  authLimiter,
  validate({ body: registerSchema }),
  async (req, res) => {
    const body = req.body as z.infer<typeof registerSchema>;

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) throw conflict('That email is already registered. Try signing in instead.');

    const user = await prisma.user.create({
      data: {
        fullName: body.fullName,
        email: body.email,
        phone: body.phone,
        passwordHash: await hashPassword(body.password),
      },
    });

    const { accessToken, refreshToken } = await issueSession(user.id, user.role);

    res
      .status(201)
      .cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions())
      .json({ data: { user: publicUser(user), accessToken } });
  }
);

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(1).max(200),
});

authRouter.post('/login', authLimiter, validate({ body: loginSchema }), async (req, res) => {
  const body = req.body as z.infer<typeof loginSchema>;

  const user = await prisma.user.findUnique({ where: { email: body.email } });

  // نفس الرسالة في الحالتين حتى لا نكشف أي بريد مسجّل.
  const invalid = unauthorized('That email or password is not correct.');

  if (!user) {
    // نُجري تجزئة وهمية حتى لا يفرّق زمن الاستجابة بين الحالتين.
    await hashPassword(body.password);
    throw invalid;
  }

  if (!(await verifyPassword(body.password, user.passwordHash))) throw invalid;

  const { accessToken, refreshToken } = await issueSession(user.id, user.role);

  res
    .cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions())
    .json({ data: { user: publicUser(user), accessToken } });
});

authRouter.post('/refresh', async (req, res) => {
  const token = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE];
  if (!token) throw unauthorized('No session to refresh.');

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashRefreshToken(token) },
    include: { user: true },
  });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw unauthorized('Your session has expired. Please sign in again.');
  }

  // تدوير الرمز: كل تجديد يُبطل السابق، فيصبح إعادة استخدام رمز مسروق مكشوفًا.
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const { accessToken, refreshToken } = await issueSession(stored.userId, stored.user.role);

  res
    .cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions())
    .json({ data: { user: publicUser(stored.user), accessToken } });
});

authRouter.post('/logout', async (req, res) => {
  const token = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE];

  if (token) {
    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashRefreshToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions(), maxAge: undefined }).status(204).end();
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
  if (!user) throw unauthorized();

  res.json({ data: publicUser(user) });
});
