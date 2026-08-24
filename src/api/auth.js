import { api, setAccessToken } from './client';

/**
 * علامة تدل على وجود جلسة محتملة.
 *
 * كوكي التجديد httpOnly فلا تستطيع JavaScript رؤيته، وبدون هذه العلامة
 * يُطلق كل زائر مجهول طلب تجديد يعود 401 في كل زيارة. العلامة ليست
 * رمزًا ولا تمنح أي صلاحية — تزويرها ينتهي بـ 401 كالمعتاد.
 */
const SESSION_HINT = 'syrup.session';

function rememberSession() {
  try {
    window.localStorage.setItem(SESSION_HINT, '1');
  } catch {
    // التخزين محجوب — سنحاول التجديد في كل مرة، وهو سلوك مقبول.
  }
}

function forgetSession() {
  try {
    window.localStorage.removeItem(SESSION_HINT);
  } catch {
    // لا شيء نفعله.
  }
}

export function hasSessionHint() {
  try {
    return window.localStorage.getItem(SESSION_HINT) === '1';
  } catch {
    return true;
  }
}

export async function login(credentials) {
  const payload = await api.post('/auth/login', credentials, { auth: false });
  setAccessToken(payload.data.accessToken);
  rememberSession();
  return payload.data.user;
}

export async function register(details) {
  const payload = await api.post('/auth/register', details, { auth: false });
  setAccessToken(payload.data.accessToken);
  rememberSession();
  return payload.data.user;
}

export async function logout() {
  try {
    await api.post('/auth/logout', undefined, { auth: false });
  } finally {
    setAccessToken(null);
    forgetSession();
  }
}

/** يستعيد الجلسة عند فتح الموقع، اعتمادًا على كوكي التجديد. */
export async function restoreSession() {
  if (!hasSessionHint()) return null;

  try {
    const payload = await api.post('/auth/refresh', undefined, { auth: false });
    setAccessToken(payload.data.accessToken);
    rememberSession();
    return payload.data.user;
  } catch (error) {
    forgetSession();
    throw error;
  }
}

export async function fetchMe() {
  const payload = await api.get('/auth/me');
  return payload.data;
}
