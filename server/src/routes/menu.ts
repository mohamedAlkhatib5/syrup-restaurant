import { Prisma } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';

import { notFound } from '../lib/errors.js';
import { money, toNumber } from '../lib/money.js';
import { requireRole } from '../middleware/auth.js';
import { validate, validatedQuery } from '../middleware/validate.js';
import { prisma } from '../prisma.js';

export const menuRouter = Router();

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

type MenuItemRow = Prisma.MenuItemGetPayload<{ include: { category: true } }>;

function present(item: MenuItemRow) {
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    category: item.category?.name ?? null,
    categorySlug: item.category?.slug ?? null,
    price: toNumber(item.price),
    description: item.description,
    image: item.imageUrl,
    isAvailable: item.isAvailable,
  };
}

const listQuery = z.object({
  category: z.string().max(60).optional(),
  includeUnavailable: z.coerce.boolean().default(false),
});

menuRouter.get('/', validate({ query: listQuery }), async (req, res) => {
  const { category, includeUnavailable } = validatedQuery<z.infer<typeof listQuery>>(req);

  const items = await prisma.menuItem.findMany({
    where: {
      ...(includeUnavailable ? {} : { isAvailable: true }),
      ...(category && category !== 'All' ? { category: { slug: slugify(category) } } : {}),
    },
    include: { category: true },
    orderBy: [{ category: { displayOrder: 'asc' } }, { name: 'asc' }],
  });

  res.json({ data: items.map(present) });
});

menuRouter.get('/:idOrSlug', async (req, res) => {
  const key = String(req.params.idOrSlug);

  const item = await prisma.menuItem.findFirst({
    where: { OR: [{ id: key }, { slug: key }] },
    include: { category: true },
  });

  if (!item) throw notFound('That dish is not on the menu.');

  res.json({ data: present(item) });
});

const upsertSchema = z.object({
  name: z.string().trim().min(2).max(150),
  categoryId: z.number().int().positive(),
  price: z.number().min(0).max(100000),
  description: z.string().trim().min(4).max(2000),
  image: z.string().trim().url().max(2000),
  isAvailable: z.boolean().default(true),
});

menuRouter.post(
  '/',
  requireRole('admin'),
  validate({ body: upsertSchema }),
  async (req, res) => {
    const body = req.body as z.infer<typeof upsertSchema>;

    const item = await prisma.menuItem.create({
      data: {
        name: body.name,
        slug: slugify(body.name),
        categoryId: body.categoryId,
        price: money(body.price),
        description: body.description,
        imageUrl: body.image,
        isAvailable: body.isAvailable,
      },
      include: { category: true },
    });

    res.status(201).json({ data: present(item) });
  }
);

menuRouter.patch(
  '/:id',
  requireRole('admin'),
  validate({ body: upsertSchema.partial() }),
  async (req, res) => {
    const body = req.body as Partial<z.infer<typeof upsertSchema>>;

    const item = await prisma.menuItem.update({
      where: { id: String(req.params.id) },
      data: {
        ...(body.name && { name: body.name, slug: slugify(body.name) }),
        ...(body.categoryId !== undefined && { categoryId: body.categoryId }),
        ...(body.price !== undefined && { price: money(body.price) }),
        ...(body.description && { description: body.description }),
        ...(body.image && { imageUrl: body.image }),
        ...(body.isAvailable !== undefined && { isAvailable: body.isAvailable }),
      },
      include: { category: true },
    });

    res.json({ data: present(item) });
  }
);

menuRouter.delete('/:id', requireRole('admin'), async (req, res) => {
  // أرشفة بدل حذف: الطلبات القديمة تشير إلى هذا الصنف.
  await prisma.menuItem.update({
    where: { id: String(req.params.id) },
    data: { isAvailable: false },
  });

  res.status(204).end();
});

export const categoriesRouter = Router();

categoriesRouter.get('/', async (_req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { displayOrder: 'asc' },
    include: { _count: { select: { menuItems: { where: { isAvailable: true } } } } },
  });

  res.json({
    data: categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      itemCount: category._count.menuItems,
    })),
  });
});
