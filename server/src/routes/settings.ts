import { Router } from 'express';
import { z } from 'zod';

import { requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { money, toNumber } from '../lib/money.js';
import { prisma } from '../prisma.js';

export const settingsRouter = Router();

const SETTINGS_ID = 1;

/** الإعدادات صف واحد. ننشئه بقيمه الافتراضية إن لم يكن موجودًا. */
export async function getSettings() {
  return prisma.setting.upsert({
    where: { id: SETTINGS_ID },
    update: {},
    create: { id: SETTINGS_ID, deliveryFee: money(10) },
  });
}

function present(setting: Awaited<ReturnType<typeof getSettings>>) {
  return {
    deliveryFee: toNumber(setting.deliveryFee),
    currency: setting.currency,
    minimumOrder: toNumber(setting.minimumOrder),
    estimatedDeliveryMinutes: [setting.deliveryEtaMinutesMin, setting.deliveryEtaMinutesMax],
    estimatedPickupMinutes: [setting.pickupEtaMinutesMin, setting.pickupEtaMinutesMax],
    isAcceptingOrders: setting.isAcceptingOrders,
  };
}

// عام: الواجهة تحتاج رسوم التوصيل وأوقات الانتظار.
settingsRouter.get('/', async (_req, res) => {
  res.json({ data: present(await getSettings()) });
});

const updateSchema = z.object({
  deliveryFee: z.number().min(0).max(1000).optional(),
  minimumOrder: z.number().min(0).max(10000).optional(),
  estimatedDeliveryMinutes: z.tuple([z.number().int().min(0), z.number().int().min(0)]).optional(),
  estimatedPickupMinutes: z.tuple([z.number().int().min(0), z.number().int().min(0)]).optional(),
  isAcceptingOrders: z.boolean().optional(),
});

// إداري: صاحب المطعم يعدّل رسوم التوصيل وأوقاته من اللوحة.
settingsRouter.patch(
  '/',
  requireRole('admin'),
  validate({ body: updateSchema }),
  async (req, res) => {
    const body = req.body as z.infer<typeof updateSchema>;

    const updated = await prisma.setting.update({
      where: { id: SETTINGS_ID },
      data: {
        ...(body.deliveryFee !== undefined && { deliveryFee: money(body.deliveryFee) }),
        ...(body.minimumOrder !== undefined && { minimumOrder: money(body.minimumOrder) }),
        ...(body.estimatedDeliveryMinutes && {
          deliveryEtaMinutesMin: body.estimatedDeliveryMinutes[0],
          deliveryEtaMinutesMax: body.estimatedDeliveryMinutes[1],
        }),
        ...(body.estimatedPickupMinutes && {
          pickupEtaMinutesMin: body.estimatedPickupMinutes[0],
          pickupEtaMinutesMax: body.estimatedPickupMinutes[1],
        }),
        ...(body.isAcceptingOrders !== undefined && {
          isAcceptingOrders: body.isAcceptingOrders,
        }),
      },
    });

    res.json({ data: present(updated) });
  }
);
