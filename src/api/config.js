/**
 * إعدادات المطعم.
 *
 * مؤقتًا ثابتة هنا. عند تشغيل الـ Backend ستأتي من
 * GET /api/settings وتصبح قابلة للتعديل من لوحة الإدارة.
 */
export const RESTAURANT = {
  name: 'Syrup',
  addressLine: 'Al Majaz Waterfront, Sharjah, UAE',
  phone: '+971 50 123 4567',
  // الماجز ووترفرونت، الشارقة — نقطة البداية للخريطة.
  location: { lat: 25.3242, lng: 55.3819 },
};

export const DEFAULT_SETTINGS = {
  deliveryFee: 10,
  currency: 'AED',
  minimumOrder: 0,
  estimatedDeliveryMinutes: [35, 45],
  estimatedPickupMinutes: [15, 20],
};
