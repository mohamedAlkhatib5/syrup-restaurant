import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';

import { unprocessable } from '../lib/errors.js';

type Sources = {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
};

/**
 * يتحقق من الطلب قبل أن يصل إلى أي منطق أعمال.
 *
 * يستبدل الحمولة بالنسخة المُحلَّلة، فما بعد هذه النقطة مضمون النوع.
 */
export function validate(schemas: Sources) {
  return (req: Request, _res: Response, next: NextFunction) => {
    for (const key of ['body', 'query', 'params'] as const) {
      const schema = schemas[key];
      if (!schema) continue;

      const result = schema.safeParse(req[key]);

      if (!result.success) {
        const details = result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));

        next(unprocessable('Some of the details you sent are not valid.', details));
        return;
      }

      if (key === 'query') {
        // query صار للقراءة فقط في Express 5.
        Object.defineProperty(req, 'validatedQuery', { value: result.data, writable: true });
      } else {
        req[key] = result.data as never;
      }
    }

    next();
  };
}

/** الوصول إلى نتيجة تحقق الـ query. */
export function validatedQuery<T>(req: Request): T {
  return (req as Request & { validatedQuery: T }).validatedQuery;
}
