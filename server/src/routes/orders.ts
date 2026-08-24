import { randomBytes } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';

import { badRequest, forbidden, notFound, unprocessable } from '../lib/errors.js';
import { money, toNumber } from '../lib/money.js';
import { optionalAuth, requireAuth, requireRole } from '../middleware/auth.js';
import { validate, validatedQuery } from '../middleware/validate.js';
import { prisma } from '../prisma.js';
import { getSettings } from './settings.js';

export const ordersRouter = Router();

/**
 * مرجع الطلب عشوائي عمدًا.
 *
 * لو كان تسلسليًا (ORD-2026-0001) لاستطاع أي شخص تخمين
 * ORD-2026-0002 وقراءة اسم زبون آخر وهاتفه وعنوانه. الطلبات كضيف
 * تُقرأ بالمرجع وحده، فوجب أن يكون غير قابل للتخمين.
 */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // بلا I/L/O/0/1 لتفادي اللبس

function buildOrderNumber(): string {
  const bytes = randomBytes(8);
  let suffix = '';

  for (let i = 0; i < 8; i += 1) {
    suffix += ALPHABET[bytes[i]! % ALPHABET.length];
  }

  return `ORD-${new Date().getFullYear()}-${suffix}`;
}

type OrderWithItems = Prisma.OrderGetPayload<{ include: { items: true } }>;

function present(order: OrderWithItems) {
  return {
    orderNumber: order.orderNumber,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    fulfilment: order.fulfilment,
    customer: {
      fullName: order.customerName,
      phone: order.customerPhone,
      email: order.customerEmail,
    },
    address:
      order.fulfilment === 'delivery'
        ? {
            line: order.addressLine,
            notes: order.addressNotes,
            lat: order.addressLat ? Number(order.addressLat) : null,
            lng: order.addressLng ? Number(order.addressLng) : null,
          }
        : null,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    cardLast4: order.cardLast4,
    scheduledFor: order.scheduledFor,
    notes: order.notes,
    items: order.items.map((item) => ({
      menuItemId: item.menuItemId,
      name: item.itemName,
      unitPrice: toNumber(item.unitPrice),
      quantity: item.quantity,
      lineTotal: toNumber(item.lineTotal),
    })),
    subtotal: toNumber(order.subtotal),
    deliveryFee: toNumber(order.deliveryFee),
    total: toNumber(order.total),
    currency: order.currency,
  };
}

/**
 * لاحظ ما لا يوجد في هذا المخطط: لا price ولا subtotal ولا total.
 * العميل يرسل ماذا يريد وبأي كمية فقط — والخادم يقرّر الثمن.
 */
const createSchema = z
  .object({
    items: z
      .array(
        z.object({
          menuItemId: z.string().min(1),
          quantity: z.number().int().min(1).max(50),
        })
      )
      .min(1, 'Your basket is empty.')
      .max(50),
    fulfilment: z.enum(['delivery', 'pickup']),
    customer: z.object({
      fullName: z.string().trim().min(2).max(120),
      phone: z.string().trim().regex(/^\+?[\d\s-]{7,20}$/, 'Enter a reachable phone number.'),
      email: z.string().trim().email().max(255).nullish(),
    }),
    address: z
      .object({
        line: z.string().trim().min(6).max(255),
        notes: z.string().trim().max(255).optional().default(''),
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      })
      .nullish(),
    paymentMethod: z.enum(['cash', 'card']),
    paymentReference: z.string().trim().max(64).nullish(),
    cardLast4: z.string().trim().regex(/^\d{4}$/).nullish(),
    scheduledFor: z.string().trim().max(20).default('asap'),
    notes: z.string().trim().max(1000).optional().default(''),
  })
  .refine((value) => value.fulfilment !== 'delivery' || value.address, {
    message: 'A delivery address is required.',
    path: ['address'],
  });

ordersRouter.post(
  '/',
  optionalAuth,
  validate({ body: createSchema }),
  async (req, res) => {
    const body = req.body as z.infer<typeof createSchema>;

    const settings = await getSettings();
    if (!settings.isAcceptingOrders) {
      throw badRequest('The kitchen is not taking orders right now.');
    }

    const order = await prisma.$transaction(async (tx) => {
      // الأسعار تُقرأ من قاعدة البيانات، لا من الطلب الوارد.
      const ids = body.items.map((item) => item.menuItemId);
      const dishes = await tx.menuItem.findMany({ where: { id: { in: ids } } });
      const byId = new Map(dishes.map((dish) => [dish.id, dish]));

      const lines = body.items.map((line) => {
        const dish = byId.get(line.menuItemId);

        if (!dish) throw unprocessable(`One of the dishes is no longer on the menu.`);
        if (!dish.isAvailable) throw unprocessable(`${dish.name} is not available right now.`);

        const unitPrice = money(dish.price);

        return {
          menuItemId: dish.id,
          itemName: dish.name,
          unitPrice,
          quantity: line.quantity,
          lineTotal: money(unitPrice.mul(line.quantity)),
        };
      });

      const subtotal = money(
        lines.reduce((sum, line) => sum.add(line.lineTotal), money(0))
      );

      if (subtotal.lessThan(settings.minimumOrder)) {
        throw unprocessable(
          `The minimum order is ${toNumber(settings.minimumOrder)} ${settings.currency}.`
        );
      }

      const deliveryFee = body.fulfilment === 'delivery' ? money(settings.deliveryFee) : money(0);

      return tx.order.create({
        data: {
          orderNumber: buildOrderNumber(),
          userId: req.user?.sub ?? null,
          customerName: body.customer.fullName,
          customerPhone: body.customer.phone,
          customerEmail: body.customer.email ?? null,
          fulfilment: body.fulfilment,
          addressLine: body.address?.line ?? null,
          addressNotes: body.address?.notes || null,
          addressLat: body.address ? body.address.lat : null,
          addressLng: body.address ? body.address.lng : null,
          subtotal,
          deliveryFee,
          total: money(subtotal.add(deliveryFee)),
          currency: settings.currency,
          paymentMethod: body.paymentMethod,
          paymentStatus: body.paymentMethod === 'card' ? 'paid' : 'due',
          paymentRef: body.paymentReference ?? null,
          cardLast4: body.cardLast4 ?? null,
          scheduledFor: body.scheduledFor,
          notes: body.notes || null,
          items: { create: lines },
        },
        include: { items: true },
      });
    });

    res.status(201).json({ data: present(order) });
  }
);

/** سجل طلبات المستخدم الحالي. قبل :orderNumber حتى لا يبتلعه. */
ordersRouter.get('/me', requireAuth, async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user!.sub },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  res.json({ data: orders.map(present) });
});

const adminListQuery = z.object({
  status: z
    .enum(['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'completed', 'cancelled'])
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

ordersRouter.get(
  '/',
  requireRole('admin'),
  validate({ query: adminListQuery }),
  async (req, res) => {
    const { status, page, limit } = validatedQuery<z.infer<typeof adminListQuery>>(req);
    const where = status ? { status } : {};

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    res.json({ data: orders.map(present), meta: { page, limit, total } });
  }
);

ordersRouter.get('/:orderNumber', optionalAuth, async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { orderNumber: String(req.params.orderNumber) },
    include: { items: true },
  });

  if (!order) throw notFound('We could not find an order with that reference.');

  // طلب مربوط بحساب لا يُقرأ إلا من صاحبه أو من الإدارة؛
  // طلبات الضيوف محمية بعشوائية المرجع نفسه.
  if (order.userId && req.user?.sub !== order.userId && req.user?.role !== 'admin') {
    throw forbidden('This order belongs to another account.');
  }

  res.json({ data: present(order) });
});

const statusSchema = z.object({
  status: z.enum([
    'pending',
    'confirmed',
    'preparing',
    'ready',
    'delivering',
    'completed',
    'cancelled',
  ]),
});

ordersRouter.patch(
  '/:orderNumber/status',
  requireRole('admin'),
  validate({ body: statusSchema }),
  async (req, res) => {
    const { status } = req.body as z.infer<typeof statusSchema>;

    const order = await prisma.order.update({
      where: { orderNumber: String(req.params.orderNumber) },
      data: {
        status,
        ...(status === 'completed' ? { paymentStatus: 'paid' as const } : {}),
      },
      include: { items: true },
    });

    res.json({ data: present(order) });
  }
);
