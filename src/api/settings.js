import { api } from './client';

/** إعدادات المطعم: رسوم التوصيل وأوقات الانتظار وحالة استقبال الطلبات. */
export async function fetchSettings({ signal } = {}) {
  const payload = await api.get('/settings', { auth: false, signal });
  return payload.data;
}

export async function updateSettings(changes) {
  const payload = await api.patch('/settings', changes);
  return payload.data;
}

/** بيانات ثابتة عن الفرع — ليست في قاعدة البيانات بعد. */
export const RESTAURANT = {
  name: 'Syrup',
  addressLine: 'Al Majaz Waterfront, Sharjah, UAE',
  phone: '+971 50 123 4567',
  location: { lat: 25.3242, lng: 55.3819 },
};

/** يُستخدم فقط ريثما تصل إعدادات الخادم، حتى لا تومض الواجهة فارغة. */
export const SETTINGS_FALLBACK = {
  deliveryFee: 10,
  currency: 'AED',
  minimumOrder: 0,
  estimatedDeliveryMinutes: [35, 45],
  estimatedPickupMinutes: [15, 20],
  isAcceptingOrders: true,
};
