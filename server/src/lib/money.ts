import { Prisma } from '@prisma/client';

/**
 * تحويل الأرقام إلى Decimal بدقة قرشين.
 *
 * كل المبالغ تمرّ من هنا: استخدام أرقام JavaScript العائمة في الحسابات
 * المالية يتراكم فيه الخطأ (0.1 + 0.2 !== 0.3).
 */
export function money(value: Prisma.Decimal | number | string): Prisma.Decimal {
  return new Prisma.Decimal(value).toDecimalPlaces(2);
}

export function toNumber(value: Prisma.Decimal | number | string): number {
  return Number(new Prisma.Decimal(value).toFixed(2));
}
