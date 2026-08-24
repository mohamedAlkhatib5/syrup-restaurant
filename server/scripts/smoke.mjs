/**
 * فحص سلوكي للـ API مقابل قاعدة بيانات حقيقية.
 *
 * يتحقق بالأخص من القواعد الأمنية التي لا يكفي فيها الاعتماد على
 * قراءة الكود: التسعير من جهة الخادم، الصلاحيات، وعدم كشف الحسابات.
 *
 * التشغيل:  node scripts/smoke.mjs   (والخادم يعمل)
 */
const API = process.env.API_URL ?? 'http://localhost:4000/api';

let passed = 0;
const failures = [];

function check(label, condition, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`  ✅ ${label}`);
  } else {
    failures.push(`${label}${detail ? ' — ' + detail : ''}`);
    console.log(`  ❌ ${label}${detail ? ' — ' + detail : ''}`);
  }
}

async function call(path, options = {}) {
  const res = await fetch(API + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
  });

  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  return { status: res.status, body, headers: res.headers };
}

// ------------------------------------------------------------------
console.log('\n▸ التسعير من جهة الخادم');

const menu = (await call('/menu-items')).body.data;
const pizza = menu.find((item) => item.name === 'Truffle Burrata Pizza');
const drink = menu.find((item) => item.name === 'Berry Sunset');

const baseOrder = {
  fulfilment: 'delivery',
  customer: { fullName: 'Test Customer', phone: '+971501234567', email: 'test@example.com' },
  address: { line: 'Al Majaz Tower 2, Al Khan Street', notes: '', lat: 25.3242, lng: 55.3819 },
  paymentMethod: 'cash',
  scheduledFor: 'asap',
  notes: '',
};

const honest = await call('/orders', {
  method: 'POST',
  body: JSON.stringify({
    ...baseOrder,
    items: [
      { menuItemId: pizza.id, quantity: 2 },
      { menuItemId: drink.id, quantity: 1 },
    ],
  }),
});

const expectedSubtotal = pizza.price * 2 + drink.price;
check('يُنشئ طلبًا', honest.status === 201, `HTTP ${honest.status}`);
check(
  `المجموع الفرعي محسوب صحيحًا (${expectedSubtotal})`,
  honest.body.data?.subtotal === expectedSubtotal,
  `حصلنا على ${honest.body.data?.subtotal}`
);
check(
  'رسوم التوصيل من الإعدادات (10)',
  honest.body.data?.deliveryFee === 10,
  `حصلنا على ${honest.body.data?.deliveryFee}`
);
check(
  `الإجمالي = ${expectedSubtotal + 10}`,
  honest.body.data?.total === expectedSubtotal + 10
);
check(
  'المرجع عشوائي لا تسلسلي',
  /^ORD-\d{4}-[A-Z2-9]{8}$/.test(honest.body.data?.orderNumber ?? ''),
  honest.body.data?.orderNumber
);

// المحاولة الخبيثة: إرسال أسعار مزيفة.
const attack = await call('/orders', {
  method: 'POST',
  body: JSON.stringify({
    ...baseOrder,
    items: [{ menuItemId: pizza.id, quantity: 2, price: 0, unitPrice: 0 }],
    subtotal: 0,
    total: 0,
    deliveryFee: 0,
    price: 0,
  }),
});

check(
  '🔒 يتجاهل السعر المزيّف الذي أرسله العميل',
  attack.status === 201 && attack.body.data.total === pizza.price * 2 + 10,
  `الإجمالي المُخزَّن ${attack.body.data?.total} بدل 0`
);

const zeroQty = await call('/orders', {
  method: 'POST',
  body: JSON.stringify({ ...baseOrder, items: [{ menuItemId: pizza.id, quantity: 0 }] }),
});
check('🔒 يرفض كمية صفر', zeroQty.status === 422);

const noAddress = await call('/orders', {
  method: 'POST',
  body: JSON.stringify({ ...baseOrder, address: null, items: [{ menuItemId: pizza.id, quantity: 1 }] }),
});
check('🔒 يرفض توصيلًا بلا عنوان', noAddress.status === 422);

const fakeDish = await call('/orders', {
  method: 'POST',
  body: JSON.stringify({
    ...baseOrder,
    items: [{ menuItemId: '00000000-0000-0000-0000-000000000000', quantity: 1 }],
  }),
});
check('🔒 يرفض طبقًا غير موجود', fakeDish.status === 422);

// ------------------------------------------------------------------
console.log('\n▸ قراءة الطلب');

const ref = honest.body.data.orderNumber;
const fetched = await call(`/orders/${ref}`);
check('يقرأ الطلب بمرجعه', fetched.status === 200 && fetched.body.data.orderNumber === ref);
check('مرجع مختلق يعطي 404', (await call('/orders/ORD-2026-ZZZZZZZZ')).status === 404);

// ------------------------------------------------------------------
console.log('\n▸ الصلاحيات');

check('قائمة الطلبات للإدارة محمية', (await call('/orders')).status === 401);
check(
  'تعديل الإعدادات محمي',
  (await call('/settings', { method: 'PATCH', body: JSON.stringify({ deliveryFee: 0 }) })).status ===
    401
);
check(
  'إضافة طبق محمية',
  (await call('/menu-items', { method: 'POST', body: JSON.stringify({}) })).status === 401
);
check('رسائل التواصل محمية', (await call('/contact-messages')).status === 401);

// ------------------------------------------------------------------
console.log('\n▸ المصادقة');

const login = await call('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email: 'admin@syrup.local', password: 'ChangeMe!2026' }),
});
check('دخول الإدارة ينجح', login.status === 200, `HTTP ${login.status}`);
check('يعيد رمز وصول', typeof login.body.data?.accessToken === 'string');
check('يعيد الدور admin', login.body.data?.user?.role === 'admin');

const cookie = login.headers.get('set-cookie') ?? '';
check('رمز التجديد في كوكي httpOnly', /httponly/i.test(cookie), cookie.slice(0, 60));
check('الكوكي SameSite=Strict', /samesite=strict/i.test(cookie));
check('لا يُعيد كلمة المرور أبدًا', !JSON.stringify(login.body).toLowerCase().includes('password'));

const badPassword = await call('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email: 'admin@syrup.local', password: 'wrong' }),
});
const unknownEmail = await call('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email: 'nobody@syrup.local', password: 'wrong' }),
});
check('كلمة مرور خاطئة تُرفض', badPassword.status === 401);
check(
  '🔒 لا يكشف أي بريد مسجّل (نفس الرسالة)',
  badPassword.body.error?.message === unknownEmail.body.error?.message
);

const token = login.body.data.accessToken;
const auth = { Authorization: `Bearer ${token}` };

check('/auth/me يعمل بالرمز', (await call('/auth/me', { headers: auth })).status === 200);
check('رمز فاسد يُرفض', (await call('/auth/me', { headers: { Authorization: 'Bearer nope' } })).status === 401);

// ------------------------------------------------------------------
console.log('\n▸ الإدارة');

const adminOrders = await call('/orders', { headers: auth });
check('الإدارة ترى الطلبات', adminOrders.status === 200 && adminOrders.body.data.length >= 2);

const statusUpdate = await call(`/orders/${ref}/status`, {
  method: 'PATCH',
  headers: auth,
  body: JSON.stringify({ status: 'preparing' }),
});
check('الإدارة تغيّر حالة الطلب', statusUpdate.body.data?.status === 'preparing');

const feeUpdate = await call('/settings', {
  method: 'PATCH',
  headers: auth,
  body: JSON.stringify({ deliveryFee: 15 }),
});
check('🎯 صاحب المطعم يعدّل رسوم التوصيل', feeUpdate.body.data?.deliveryFee === 15);

const afterFee = await call('/orders', {
  method: 'POST',
  body: JSON.stringify({ ...baseOrder, items: [{ menuItemId: drink.id, quantity: 1 }] }),
});
check(
  '🎯 الطلب الجديد يستخدم الرسوم الجديدة (15)',
  afterFee.body.data?.deliveryFee === 15,
  `حصلنا على ${afterFee.body.data?.deliveryFee}`
);

await call('/settings', { method: 'PATCH', headers: auth, body: JSON.stringify({ deliveryFee: 10 }) });

const pickup = await call('/orders', {
  method: 'POST',
  body: JSON.stringify({
    ...baseOrder,
    fulfilment: 'pickup',
    address: null,
    items: [{ menuItemId: drink.id, quantity: 1 }],
  }),
});
check('الاستلام من الفرع بلا رسوم توصيل', pickup.body.data?.deliveryFee === 0);

// ------------------------------------------------------------------
console.log('\n▸ نموذج التواصل');

const message = await call('/contact-messages', {
  method: 'POST',
  body: JSON.stringify({
    fullName: 'Test Guest',
    email: 'guest@example.com',
    subject: 'table_reservation',
    message: 'Do you have a table for six on Friday evening?',
  }),
});
check('يستقبل رسالة', message.status === 201);
check(
  'يرفض رسالة قصيرة',
  (
    await call('/contact-messages', {
      method: 'POST',
      body: JSON.stringify({
        fullName: 'X',
        email: 'not-an-email',
        subject: 'general_enquiry',
        message: 'hi',
      }),
    })
  ).status === 422
);
check('الإدارة تقرأ الرسائل', (await call('/contact-messages', { headers: auth })).status === 200);

// ------------------------------------------------------------------
console.log('\n' + '─'.repeat(58));
if (failures.length === 0) {
  console.log(`  ✅ ${passed}/${passed} فحصًا نجحت`);
} else {
  console.log(`  ${passed} نجح · ${failures.length} فشل:\n`);
  failures.forEach((f) => console.log('     • ' + f));
}
console.log('─'.repeat(58) + '\n');

process.exit(failures.length === 0 ? 0 : 1);
