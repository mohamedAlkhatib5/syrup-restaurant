import { DEFAULT_SETTINGS } from './config';

/**
 * واجهة الطلبات.
 *
 * التوقيعات هنا هي التوقيعات النهائية. المحرّك الحالي يحفظ محليًا في
 * المتصفح حتى يجهز الـ Backend؛ عندها يُستبدل جسم كل دالة بنداء HTTP
 * دون تغيير أي مكوّن يستهلكها.
 *
 * ملاحظة أمنية مقصودة: الإجماليات تُحسب هنا مؤقتًا فقط. حين يوجد
 * خادم، تصبح الأسعار والإجماليات مسؤوليته وحده ولا يُقبل أي مبلغ
 * قادم من المتصفح.
 */
const STORAGE_KEY = 'syrup.orders.v1';

function readOrders() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeOrders(orders) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders.slice(-30)));
  } catch {
    // الحصة ممتلئة — الطلب يبقى معروضًا في هذه الجلسة فقط.
  }
}

function buildOrderNumber(sequence) {
  const year = new Date().getFullYear();
  return `ORD-${year}-${String(sequence).padStart(4, '0')}`;
}

const delay = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

/**
 * ينشئ طلبًا جديدًا.
 *
 * @param {object} input
 * @param {Array<{id:number,name:string,price:number,quantity:number,image:string}>} input.items
 * @param {'delivery'|'pickup'} input.fulfilment
 * @param {object} input.customer  { fullName, phone, email }
 * @param {object|null} input.address  { line, notes, lat, lng }
 * @param {'cash'|'card'} input.paymentMethod
 * @param {string} input.scheduledFor  'asap' أو وقت محدد
 * @param {string} input.notes
 */
export async function createOrder(input) {
  await delay(650); // محاكاة زمن الشبكة حتى تُختبر حالات التحميل فعليًا.

  const orders = readOrders();

  const items = input.items.map((item) => ({
    menuItemId: item.id,
    name: item.name,
    unitPrice: Number(item.price),
    quantity: item.quantity,
    image: item.image,
    lineTotal: Number(item.price) * item.quantity,
  }));

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const deliveryFee = input.fulfilment === 'delivery' ? DEFAULT_SETTINGS.deliveryFee : 0;

  const order = {
    orderNumber: buildOrderNumber(orders.length + 1),
    status: 'pending',
    createdAt: new Date().toISOString(),
    fulfilment: input.fulfilment,
    customer: input.customer,
    address: input.address,
    paymentMethod: input.paymentMethod,
    paymentStatus: input.paymentMethod === 'card' ? 'paid' : 'due_on_delivery',
    scheduledFor: input.scheduledFor,
    notes: input.notes,
    items,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    currency: DEFAULT_SETTINGS.currency,
  };

  writeOrders([...orders, order]);
  return order;
}

/** يجلب طلبًا برقمه. */
export async function getOrderByNumber(orderNumber) {
  await delay(300);

  const order = readOrders().find((candidate) => candidate.orderNumber === orderNumber);

  if (!order) {
    const error = new Error('Order not found');
    error.status = 404;
    throw error;
  }

  return order;
}
