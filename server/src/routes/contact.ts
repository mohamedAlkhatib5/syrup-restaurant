import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

import { requireRole } from '../middleware/auth.js';
import { validate, validatedQuery } from '../middleware/validate.js';
import { prisma } from '../prisma.js';

export const contactRouter = Router();

// نموذج عام بلا مصادقة: هدف بديهي للـ spam إن تُرك مفتوحًا.
const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: { code: 'too_many_requests', message: 'You have sent several messages already.' },
  },
});

const submitSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(255),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  subject: z.enum(['table_reservation', 'private_event', 'large_order', 'general_enquiry']),
  message: z.string().trim().min(10, 'Tell us a little more.').max(4000),
});

contactRouter.post('/', submitLimiter, validate({ body: submitSchema }), async (req, res) => {
  const body = req.body as z.infer<typeof submitSchema>;

  const created = await prisma.contactMessage.create({
    data: {
      fullName: body.fullName,
      email: body.email,
      phone: body.phone || null,
      subject: body.subject,
      message: body.message,
    },
  });

  res.status(201).json({
    data: { id: created.id },
    message: 'Thank you. We will be in touch shortly.',
  });
});

const listQuery = z.object({
  isRead: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

contactRouter.get('/', requireRole('admin'), validate({ query: listQuery }), async (req, res) => {
  const { isRead, page, limit } = validatedQuery<{
    isRead?: boolean;
    page: number;
    limit: number;
  }>(req);

  const where = isRead === undefined ? {} : { isRead };

  const [messages, total] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.contactMessage.count({ where }),
  ]);

  res.json({ data: messages, meta: { page, limit, total } });
});

contactRouter.patch(
  '/:id',
  requireRole('admin'),
  validate({ body: z.object({ isRead: z.boolean() }) }),
  async (req, res) => {
    const message = await prisma.contactMessage.update({
      where: { id: String(req.params.id) },
      data: { isRead: (req.body as { isRead: boolean }).isRead },
    });

    res.json({ data: message });
  }
);
