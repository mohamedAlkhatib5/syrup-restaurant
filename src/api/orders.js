import { api } from './client';

/**
 * ينشئ طلبًا.
 *
 * لا نرسل أي سعر: الخادم يقرأ الأسعار من قاعدة البيانات ويحسب
 * الإجماليات بنفسه. إرسال مبلغ من المتصفح كان سيجعل تزويره ممكنًا.
 */
export async function createOrder(input) {
  const payload = await api.post(
    '/orders',
    {
      items: input.items.map((item) => ({
        menuItemId: item.id,
        quantity: item.quantity,
      })),
      fulfilment: input.fulfilment,
      customer: input.customer,
      address: input.address,
      paymentMethod: input.paymentMethod,
      paymentReference: input.payment?.reference ?? null,
      cardLast4: input.payment?.last4 ?? null,
      scheduledFor: input.scheduledFor,
      notes: input.notes,
    }
    // بلا { auth: false }: المسار يقبل الضيوف، لكن إن كان المستخدم
    // مسجّلًا وجب إرسال رمزه ليُربط الطلب بحسابه ويظهر في سجله.
  );

  return payload.data;
}

export async function getOrderByNumber(orderNumber, { signal } = {}) {
  const payload = await api.get(`/orders/${encodeURIComponent(orderNumber)}`, { signal });
  return payload.data;
}

export async function fetchMyOrders({ signal } = {}) {
  const payload = await api.get('/orders/me', { signal });
  return payload.data;
}

export async function fetchOrders({ status, page = 1, limit = 25, signal } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) params.set('status', status);

  return api.get(`/orders?${params}`, { signal });
}

export async function updateOrderStatus(orderNumber, status) {
  const payload = await api.patch(`/orders/${encodeURIComponent(orderNumber)}/status`, {
    status,
  });
  return payload.data;
}
