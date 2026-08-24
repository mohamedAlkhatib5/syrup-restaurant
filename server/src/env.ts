import { readFileSync } from 'node:fs';
import { z } from 'zod';

// تحميل .env يدويًا: لا حاجة لاعتمادية إضافية لملف بهذه البساطة.
try {
  const raw = readFileSync(new URL('../.env', import.meta.url), 'utf8');

  for (const line of raw.split('\n')) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!match) continue;

    const key = match[1]!;
    if (process.env[key] !== undefined) continue;

    process.env[key] = match[2]!.replace(/^["']|["']$/g, '');
  }
} catch {
  // لا يوجد .env — نعتمد على متغيرات البيئة الحقيقية.
}

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32, 'سر الوصول قصير جدًا'),
  JWT_REFRESH_SECRET: z.string().min(32, 'سر التجديد قصير جدًا'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().int().positive().default(15),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('\nإعدادات البيئة غير صالحة:\n');
  for (const issue of parsed.error.issues) {
    console.error(`   - ${issue.path.join('.')}: ${issue.message}`);
  }
  console.error('\n   انسخ server/.env.example إلى server/.env واملأ القيم.\n');
  process.exit(1);
}

export const env = {
  ...parsed.data,
  isProduction: parsed.data.NODE_ENV === 'production',
  corsOrigins: parsed.data.CORS_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};
