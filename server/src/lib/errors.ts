/** خطأ يحمل رمز حالة HTTP ورمزًا نصيًا ثابتًا يعتمد عليه العميل. */
export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new AppError(400, 'bad_request', message, details);

export const unauthorized = (message = 'Authentication is required.') =>
  new AppError(401, 'unauthorized', message);

export const forbidden = (message = 'You do not have access to this resource.') =>
  new AppError(403, 'forbidden', message);

export const notFound = (message = 'Resource not found.') =>
  new AppError(404, 'not_found', message);

export const conflict = (message: string) => new AppError(409, 'conflict', message);

export const unprocessable = (message: string, details?: unknown) =>
  new AppError(422, 'unprocessable', message, details);
