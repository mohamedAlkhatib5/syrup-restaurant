/**
 * عميل HTTP الوحيد للتطبيق.
 *
 * لا يستدعي أي مكوّن fetch مباشرة: كل ما يخص عنوان الـ API، وترويسة
 * المصادقة، وتجديد الرمز المنتهي، وشكل الأخطاء — يعيش هنا.
 */
import { handleDemoRequest } from './demo-backend';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

/**
 * الوضع التجريبي: نسخة من الـ API تعمل داخل المتصفح.
 *
 * تُفعَّل فقط في بناء العرض العام، حيث لا خادم ولا قاعدة بيانات.
 * في التشغيل الحقيقي تبقى false ولا يُحمَّل أي شيء منها.
 */
export const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true';

/** خطأ يحمل رمز الحالة والرمز النصي القادمين من الخادم. */
export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * رمز الوصول يعيش في الذاكرة فقط.
 *
 * وضعه في localStorage يجعل أي ثغرة XSS كافية لسرقة الحساب. رمز
 * التجديد في كوكي httpOnly لا تستطيع JavaScript قراءته أصلًا.
 */
let accessToken = null;
let onSessionLost = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function setSessionLostHandler(handler) {
  onSessionLost = handler;
}

async function parse(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function send(path, { method = 'GET', body, signal, auth = true } = {}) {
  if (IS_DEMO) {
    try {
      return await handleDemoRequest(method, path, body);
    } catch (error) {
      throw new ApiError(
        error.status ?? 500,
        error.code ?? 'demo_error',
        error.message,
        error.details
      );
    }
  }

  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let response;

  try {
    response = await fetch(BASE_URL + path, {
      method,
      headers,
      credentials: 'include',
      ...(body !== undefined && { body: JSON.stringify(body) }),
      ...(signal && { signal }),
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError(
      0,
      'network_error',
      'We could not reach the kitchen. Check your connection.'
    );
  }

  if (response.status === 204) return null;

  const payload = await parse(response);

  if (!response.ok) {
    const error = payload?.error ?? {};
    throw new ApiError(
      response.status,
      error.code ?? 'unknown_error',
      error.message ?? 'Something went wrong.',
      error.details
    );
  }

  return payload;
}

// تجديد واحد مشترك: عدة طلبات تفشل معًا بـ 401 يجب ألا تُطلق عدة تجديدات.
let refreshInFlight = null;

async function refreshSession() {
  refreshInFlight ??= send('/auth/refresh', { method: 'POST', auth: false })
    .then((payload) => {
      accessToken = payload.data.accessToken;
      return payload.data;
    })
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
}

/** ينفّذ الطلب، ويجدّد الجلسة مرة واحدة إن انتهى رمز الوصول. */
export async function request(path, options = {}) {
  try {
    return await send(path, options);
  } catch (error) {
    const canRetry =
      error instanceof ApiError && error.status === 401 && options.auth !== false;

    if (!canRetry || options._retried) throw error;

    try {
      await refreshSession();
    } catch {
      accessToken = null;
      onSessionLost?.();
      throw error;
    }

    return send(path, { ...options, _retried: true });
  }
}

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
};
