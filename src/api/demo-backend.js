/**
 * نسخة من الـ API تعمل داخل المتصفح.
 *
 * لماذا: الاستضافة المجانية للواجهة لا تشغّل خادم Express ولا MySQL.
 * ولأن الغرض من الرابط العام أن يجرّب الزائر الطلب ولوحة الإدارة
 * فعليًا، يحاكي هذا الملف نفس المسارات ونفس أشكال الاستجابة مقابل
 * تخزين المتصفح.
 *
 * يُفعَّل فقط حين VITE_DEMO_MODE=true. في التشغيل الحقيقي لا يُستدعى
 * أبدًا، ويبقى الخادم في server/ هو المصدر الوحيد للحقيقة.
 *
 * القواعد المحفوظة كما في الخادم الحقيقي:
 *   - الأسعار تُقرأ من البيانات، ولا يُقبل أي مبلغ من العميل.
 *   - مرجع الطلب عشوائي لا تسلسلي.
 *   - المسارات الإدارية ترفض من ليس admin.
 * ما لا يُحاكى: تجزئة كلمات المرور، الكوكيز، حدّ الطلبات. هذه بيانات
 * تجريبية في متصفح الزائر وحده ولا تغادره.
 */
import { menuSeed } from './demo-seed';

const STORE_KEY = 'syrup.demo.v1';

const DEMO_ADMIN = { email: 'admin@syrup.local', password: 'demo1234' };

const CATEGORIES = [
  'Pizza',
  'Grill',
  'Pasta',
  'Burgers',
  'Seafood',
  'Bowls',
  'Desserts',
  'Drinks',
];

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function reference() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  let suffix = '';
  for (const byte of bytes) suffix += ALPHABET[byte % ALPHABET.length];
  return `ORD-${new Date().getFullYear()}-${suffix}`;
}

const id = () => crypto.randomUUID();

function seed() {
  const categories = CATEGORIES.map((name, index) => ({
    id: index + 1,
    name,
    slug: slugify(name),
    displayOrder: index,
  }));

  const byName = new Map(categories.map((category) => [category.name, category.id]));

  return {
    categories,
    menuItems: menuSeed.map((dish) => ({
      id: id(),
      name: dish.name,
      slug: slugify(dish.name),
      categoryId: byName.get(dish.category),
      category: dish.category,
      price: dish.price,
      description: dish.description,
      image: dish.image,
      isAvailable: true,
    })),
    orders: [],
    messages: [],
    users: [
      {
        id: id(),
        fullName: 'Syrup Admin',
        email: DEMO_ADMIN.email,
        phone: '+971 50 123 4567',
        password: DEMO_ADMIN.password,
        role: 'admin',
      },
    ],
    settings: {
      deliveryFee: 10,
      currency: 'AED',
      minimumOrder: 0,
      estimatedDeliveryMinutes: [35, 45],
      estimatedPickupMinutes: [15, 20],
      isAcceptingOrders: true,
    },
    session: null,
  };
}

function load() {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.menuItems?.length) return parsed;
    }
  } catch {
    // بيانات تالفة — نبدأ من جديد.
  }

  const fresh = seed();
  save(fresh);
  return fresh;
}

function save(state) {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {
    // التخزين محجوب — التجربة تعمل في الذاكرة لهذه الجلسة.
  }
}

let db = null;
const store = () => (db ??= load());
const commit = () => save(db);

/** يعيد الحالة إلى بياناتها الأولى — يستخدمها زر "إعادة ضبط التجربة". */
export function resetDemo() {
  db = seed();
  commit();
}

class DemoError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const publicUser = (user) => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  role: user.role,
});

function currentUser(state) {
  if (!state.session) return null;
  return state.users.find((user) => user.id === state.session) ?? null;
}

function requireAdmin(state) {
  const user = currentUser(state);
  if (!user) throw new DemoError(401, 'unauthorized', 'Authentication is required.');
  if (user.role !== 'admin') {
    throw new DemoError(403, 'forbidden', 'You do not have access to this resource.');
  }
  return user;
}

function requireUser(state) {
  const user = currentUser(state);
  if (!user) throw new DemoError(401, 'unauthorized', 'Authentication is required.');
  return user;
}

const presentOrder = (order) => ({ ...order });

// ─────────────────────────────────────────────────────────────────────
const routes = [
  // ---- الإعدادات ----
  ['GET', /^\/settings$/, (state) => ({ data: state.settings })],

  [
    'PATCH',
    /^\/settings$/,
    (state, _m, body) => {
      requireAdmin(state);
      state.settings = { ...state.settings, ...body };
      commit();
      return { data: state.settings };
    },
  ],

  // ---- التصنيفات ----
  [
    'GET',
    /^\/categories$/,
    (state) => ({
      data: state.categories.map((category) => ({
        ...category,
        itemCount: state.menuItems.filter(
          (item) => item.categoryId === category.id && item.isAvailable
        ).length,
      })),
    }),
  ],

  // ---- القائمة ----
  [
    'GET',
    /^\/menu-items(\?.*)?$/,
    (state, match) => {
      const params = new URLSearchParams(match[1] ?? '');
      const category = params.get('category');
      const includeUnavailable = params.get('includeUnavailable') === 'true';

      if (includeUnavailable) requireAdmin(state);

      const data = state.menuItems.filter(
        (item) =>
          (includeUnavailable || item.isAvailable) &&
          (!category || category === 'All' || item.category === category)
      );

      return includeUnavailable ? { data } : { data };
    },
  ],

  [
    'POST',
    /^\/menu-items$/,
    (state, _m, body) => {
      requireAdmin(state);
      const category = state.categories.find((c) => c.id === Number(body.categoryId));
      const dish = {
        id: id(),
        name: body.name,
        slug: slugify(body.name),
        categoryId: Number(body.categoryId),
        category: category?.name ?? null,
        price: Number(body.price),
        description: body.description,
        image: body.image,
        isAvailable: body.isAvailable ?? true,
      };
      state.menuItems.push(dish);
      commit();
      return { data: dish };
    },
  ],

  [
    'PATCH',
    /^\/menu-items\/([^/?]+)$/,
    (state, match, body) => {
      requireAdmin(state);
      const dish = state.menuItems.find((item) => item.id === match[1]);
      if (!dish) throw new DemoError(404, 'not_found', 'That dish is not on the menu.');

      Object.assign(dish, {
        ...(body.name && { name: body.name, slug: slugify(body.name) }),
        ...(body.categoryId !== undefined && {
          categoryId: Number(body.categoryId),
          category: state.categories.find((c) => c.id === Number(body.categoryId))?.name,
        }),
        ...(body.price !== undefined && { price: Number(body.price) }),
        ...(body.description && { description: body.description }),
        ...(body.image && { image: body.image }),
        ...(body.isAvailable !== undefined && { isAvailable: body.isAvailable }),
      });

      commit();
      return { data: dish };
    },
  ],

  // ---- الطلبات ----
  [
    'POST',
    /^\/orders$/,
    (state, _m, body) => {
      if (!state.settings.isAcceptingOrders) {
        throw new DemoError(
          400,
          'bad_request',
          'The kitchen is not taking orders right now.'
        );
      }

      // الأسعار من البيانات، لا من الطلب الوارد — كما في الخادم الحقيقي.
      const items = body.items.map((line) => {
        const dish = state.menuItems.find((item) => item.id === line.menuItemId);
        if (!dish)
          throw new DemoError(422, 'unprocessable', 'A dish is no longer on the menu.');

        return {
          menuItemId: dish.id,
          name: dish.name,
          image: dish.image,
          unitPrice: dish.price,
          quantity: line.quantity,
          lineTotal: dish.price * line.quantity,
        };
      });

      const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
      const deliveryFee = body.fulfilment === 'delivery' ? state.settings.deliveryFee : 0;
      const user = currentUser(state);

      const order = {
        orderNumber: reference(),
        status: 'pending',
        createdAt: new Date().toISOString(),
        userId: user?.id ?? null,
        fulfilment: body.fulfilment,
        customer: body.customer,
        address: body.address ?? null,
        paymentMethod: body.paymentMethod,
        paymentStatus: body.paymentMethod === 'card' ? 'paid' : 'due',
        cardLast4: body.cardLast4 ?? null,
        scheduledFor: body.scheduledFor ?? 'asap',
        notes: body.notes || null,
        items,
        subtotal,
        deliveryFee,
        total: subtotal + deliveryFee,
        currency: state.settings.currency,
      };

      state.orders.unshift(order);
      commit();
      return { data: presentOrder(order) };
    },
  ],

  [
    'GET',
    /^\/orders\/me$/,
    (state) => {
      const user = requireUser(state);
      return {
        data: state.orders.filter((order) => order.userId === user.id).map(presentOrder),
      };
    },
  ],

  [
    'GET',
    /^\/orders(\?.*)?$/,
    (state, match) => {
      requireAdmin(state);
      const params = new URLSearchParams(match[1] ?? '');
      const status = params.get('status');
      const filtered = status
        ? state.orders.filter((o) => o.status === status)
        : state.orders;

      return {
        data: filtered.slice(0, 50).map(presentOrder),
        meta: { page: 1, limit: 50, total: filtered.length },
      };
    },
  ],

  [
    'GET',
    /^\/orders\/([^/?]+)$/,
    (state, match) => {
      const order = state.orders.find((o) => o.orderNumber === match[1]);
      if (!order) throw new DemoError(404, 'not_found', 'We could not find that order.');

      const user = currentUser(state);
      if (order.userId && user?.id !== order.userId && user?.role !== 'admin') {
        throw new DemoError(403, 'forbidden', 'This order belongs to another account.');
      }

      return { data: presentOrder(order) };
    },
  ],

  [
    'PATCH',
    /^\/orders\/([^/?]+)\/status$/,
    (state, match, body) => {
      requireAdmin(state);
      const order = state.orders.find((o) => o.orderNumber === match[1]);
      if (!order) throw new DemoError(404, 'not_found', 'We could not find that order.');

      order.status = body.status;
      if (body.status === 'completed') order.paymentStatus = 'paid';
      commit();
      return { data: presentOrder(order) };
    },
  ],

  // ---- الرسائل ----
  [
    'POST',
    /^\/contact-messages$/,
    (state, _m, body) => {
      if (!body.message || body.message.trim().length < 10) {
        throw new DemoError(
          422,
          'unprocessable',
          'Some of the details you sent are not valid.',
          [{ field: 'message', message: 'Tell us a little more.' }]
        );
      }

      const message = {
        id: id(),
        ...body,
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      state.messages.unshift(message);
      commit();
      return {
        data: { id: message.id },
        message: 'Thank you. We will be in touch shortly.',
      };
    },
  ],

  [
    'GET',
    /^\/contact-messages(\?.*)?$/,
    (state, match) => {
      requireAdmin(state);
      const params = new URLSearchParams(match[1] ?? '');
      const isRead = params.get('isRead');
      const filtered =
        isRead === null
          ? state.messages
          : state.messages.filter((m) => String(m.isRead) === isRead);

      return { data: filtered, meta: { page: 1, limit: 25, total: filtered.length } };
    },
  ],

  [
    'PATCH',
    /^\/contact-messages\/([^/?]+)$/,
    (state, match, body) => {
      requireAdmin(state);
      const message = state.messages.find((m) => m.id === match[1]);
      if (!message) throw new DemoError(404, 'not_found', 'Message not found.');

      message.isRead = body.isRead;
      commit();
      return { data: message };
    },
  ],

  // ---- المصادقة ----
  [
    'POST',
    /^\/auth\/login$/,
    (state, _m, body) => {
      const user = state.users.find(
        (candidate) => candidate.email.toLowerCase() === String(body.email).toLowerCase()
      );

      if (!user || user.password !== body.password) {
        throw new DemoError(
          401,
          'unauthorized',
          'That email or password is not correct.'
        );
      }

      state.session = user.id;
      commit();
      return { data: { user: publicUser(user), accessToken: `demo.${user.id}` } };
    },
  ],

  [
    'POST',
    /^\/auth\/register$/,
    (state, _m, body) => {
      const email = String(body.email).toLowerCase();

      if (state.users.some((user) => user.email.toLowerCase() === email)) {
        throw new DemoError(409, 'conflict', 'That email is already registered.');
      }
      if (String(body.password).length < 8) {
        throw new DemoError(
          422,
          'unprocessable',
          'Some of the details you sent are not valid.',
          [{ field: 'password', message: 'Use at least 8 characters.' }]
        );
      }

      const user = {
        id: id(),
        fullName: body.fullName,
        email,
        phone: body.phone,
        password: body.password,
        role: 'customer',
      };

      state.users.push(user);
      state.session = user.id;
      commit();
      return { data: { user: publicUser(user), accessToken: `demo.${user.id}` } };
    },
  ],

  [
    'POST',
    /^\/auth\/refresh$/,
    (state) => {
      const user = currentUser(state);
      if (!user) throw new DemoError(401, 'unauthorized', 'No session to refresh.');
      return { data: { user: publicUser(user), accessToken: `demo.${user.id}` } };
    },
  ],

  [
    'POST',
    /^\/auth\/logout$/,
    (state) => {
      state.session = null;
      commit();
      return null;
    },
  ],

  ['GET', /^\/auth\/me$/, (state) => ({ data: publicUser(requireUser(state)) })],

  ['GET', /^\/health$/, () => ({ status: 'ok', database: 'demo' })],
];

/** يوجّه الطلب إلى المعالج المطابق. يحاكي زمن الشبكة ليظهر التحميل. */
export async function handleDemoRequest(method, path, body) {
  await new Promise((resolve) => window.setTimeout(resolve, 260));

  const state = store();

  for (const [verb, pattern, handler] of routes) {
    if (verb !== method) continue;

    const match = pattern.exec(path);
    if (!match) continue;

    try {
      return handler(state, match, body);
    } catch (error) {
      if (error instanceof DemoError) throw error;
      throw new DemoError(500, 'internal_error', error.message);
    }
  }

  throw new DemoError(404, 'not_found', `No route matches ${method} ${path}`);
}

export { DemoError, DEMO_ADMIN };
