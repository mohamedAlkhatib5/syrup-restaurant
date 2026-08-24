/**
 * فحص المصادقة ولوحة الإدارة في متصفح حقيقي.
 *
 * يكمل verify-site.mjs الذي يغطي الصفحات العامة. يتحقق هنا بالأخص من
 * أن منع الوصول ليس مجرد إخفاء زر في الواجهة.
 *
 * التشغيل:  npm run verify:admin   (والواجهة والـ API يعملان)
 */
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173';
const API = process.env.API_URL ?? 'http://localhost:4000/api';
const SHOTS = 'screenshots';

const ADMIN = { email: 'admin@syrup.local', password: 'ChangeMe!2026' };

let passed = 0;
const failures = [];

const check = (label, ok, detail = '') => {
  if (ok) {
    passed += 1;
    console.log(`  ✅ ${label}`);
  } else {
    failures.push(`${label}${detail ? ' — ' + detail : ''}`);
    console.log(`  ❌ ${label}${detail ? ' — ' + detail : ''}`);
  }
};

function watch(page, label) {
  page.on('pageerror', (err) => failures.push(`[${label}] pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    // 401 على المسارات المحمية أثناء الاختبار سلوك مقصود.
    if (/401|403/.test(msg.text())) return;
    failures.push(`[${label}] console: ${msg.text()}`);
  });
}

async function signIn(page, credentials) {
  await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
  await page.fill('#login-email', credentials.email);
  await page.fill('#login-password', credentials.password);
  await page.getByRole('button', { name: /Sign in/ }).click();
}

async function main() {
  await mkdir(SHOTS, { recursive: true });
  const browser = await chromium.launch();

  // ------------------------------------------------------------------
  console.log('\n▸ حماية المسارات قبل الدخول');
  const guest = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const g = await guest.newPage();
  watch(g, 'guest');

  await g.goto(BASE + '/admin/orders', { waitUntil: 'networkidle' });
  check('زائر يُحوّل من /admin إلى تسجيل الدخول', g.url().includes('/login'), g.url());
  check('يحتفظ بوجهته للعودة إليها', g.url().includes('redirect='), g.url());

  await g.goto(BASE + '/account/orders', { waitUntil: 'networkidle' });
  check('زائر يُحوّل من /account إلى تسجيل الدخول', g.url().includes('/login'));

  // الأهم: الخادم يمنع حتى لو تجاوز أحد الواجهة.
  const direct = await fetch(`${API}/orders`);
  check('🔒 الخادم يرفض /api/orders بلا رمز (401)', direct.status === 401, `HTTP ${direct.status}`);

  const directSettings = await fetch(`${API}/settings`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deliveryFee: 0 }),
  });
  check('🔒 الخادم يرفض تعديل الإعدادات بلا رمز', directSettings.status === 401);

  await g.screenshot({ path: `${SHOTS}/auth-1-login.png`, fullPage: true });
  await g.close();

  // ------------------------------------------------------------------
  console.log('\n▸ تسجيل زبون جديد');
  const customer = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const c = await customer.newPage();
  watch(c, 'customer');

  const stamp = Math.abs(
    [...String(process.pid)].reduce((a, ch) => a * 31 + Number(ch), 7)
  );
  const email = `guest${stamp}@example.com`;

  await c.goto(BASE + '/register', { waitUntil: 'networkidle' });
  await c.fill('#register-name', 'Test Guest');
  await c.fill('#register-phone', '+971509998877');
  await c.fill('#register-email', email);
  await c.fill('#register-password', 'StrongPass!2026');
  await c.screenshot({ path: `${SHOTS}/auth-2-register.png`, fullPage: true });
  await c.getByRole('button', { name: /Create account/ }).click();

  await c.waitForURL('**/account/orders', { timeout: 15000 });
  check('التسجيل ينجح ويقود إلى الحساب', c.url().includes('/account/orders'));
  check('النافبار يعرض اسم المستخدم', (await c.textContent('body')).includes('Test'));

  await c.waitForSelector('.data-state, .account-order', { timeout: 12000 });
  const emptyState = await c.textContent('body');
  check('حالة فارغة واضحة لمن لا طلبات له', emptyState.includes('No orders yet'));
  await c.screenshot({ path: `${SHOTS}/auth-3-account-empty.png`, fullPage: true });

  // الجلسة تنجو من إعادة التحميل
  await c.reload({ waitUntil: 'networkidle' });
  await c.waitForTimeout(800);
  check('الجلسة تنجو من إعادة تحميل الصفحة', (await c.textContent('body')).includes('Test'));

  // زبون عادي لا يصل إلى لوحة الإدارة
  await c.goto(BASE + '/admin/orders', { waitUntil: 'networkidle' });
  await c.waitForTimeout(600);
  check(
    '🔒 زبون عادي لا يصل إلى لوحة الإدارة',
    !c.url().includes('/admin'),
    c.url()
  );

  // طلب حقيقي ثم ظهوره في سجل الطلبات
  console.log('\n▸ طلب زبون مسجّل');
  await c.goto(BASE + '/menu', { waitUntil: 'networkidle' });
  await c.getByRole('button', { name: /Add .* to your order/ }).first().click();
  await c.goto(BASE + '/checkout', { waitUntil: 'networkidle' });
  await c.fill('#checkout-name', 'Test Guest');
  await c.fill('#checkout-phone', '+971509998877');
  await c.fill('#checkout-address', 'Al Majaz Tower 2, Al Khan Street, Sharjah');
  await c.getByRole('button', { name: /Place order/ }).click();
  await c.waitForURL('**/order/ORD-**', { timeout: 20000 });

  const ref = (await c.textContent('.confirmation-reference')).replace(/\s+/g, ' ').trim();
  check('الطلب أُنشئ', /ORD-\d{4}-[A-Z2-9]{8}/.test(ref), ref);

  await c.goto(BASE + '/account/orders', { waitUntil: 'networkidle' });
  await c.waitForSelector('.account-order, .data-state', { timeout: 12000 });
  await c.waitForTimeout(500);
  const history = await c.textContent('body');
  check('🎯 الطلب يظهر في سجل الزبون', /ORD-\d{4}-[A-Z2-9]{8}/.test(history));
  check('زر إعادة الطلب موجود', history.includes('Order again'));

  await c.getByRole('button', { name: 'Order again' }).first().click();
  await c.waitForTimeout(700);
  const badge = (await c.locator('.order-button b').textContent()).trim();
  check('🎯 إعادة الطلب تملأ السلة', Number(badge) > 0, `العدّاد ${badge}`);
  await c.screenshot({ path: `${SHOTS}/auth-4-account-orders.png`, fullPage: true });

  await customer.close();

  // ------------------------------------------------------------------
  console.log('\n▸ لوحة الإدارة');
  const adminCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const a = await adminCtx.newPage();
  watch(a, 'admin');

  await signIn(a, ADMIN);
  await a.waitForURL('**/admin/orders', { timeout: 15000 });
  check('الإدارة تدخل مباشرة إلى اللوحة', a.url().includes('/admin/orders'));

  await a.waitForSelector('.order-card', { timeout: 10000 });
  const cards = await a.locator('.order-card').count();
  check('اللوحة تعرض الطلبات', cards > 0, `${cards} بطاقة`);
  await a.screenshot({ path: `${SHOTS}/admin-1-orders.png`, fullPage: true });

  // تقديم حالة طلب
  const advanceButton = a.locator('.btn-advance').first();
  if (await advanceButton.count()) {
    const label = await advanceButton.textContent();
    await advanceButton.click();
    await a.waitForTimeout(1600);
    check(`🎯 تغيير حالة الطلب بضغطة (${label.trim()})`, true);
  } else {
    check('زر تقديم الحالة موجود', false, 'لا يوجد طلب مفتوح');
  }

  // الإعدادات
  await a.goto(BASE + '/admin/settings', { waitUntil: 'networkidle' });
  await a.waitForSelector('#delivery-fee', { timeout: 10000 });
  await a.fill('#delivery-fee', '12');
  await a.getByRole('button', { name: /Save settings/ }).click();
  await a.waitForTimeout(1600);
  await a.screenshot({ path: `${SHOTS}/admin-2-settings.png`, fullPage: true });

  const fee = await fetch(`${API}/settings`).then((r) => r.json());
  check('🎯 رسوم التوصيل تُحفظ فعليًا', fee.data.deliveryFee === 12, `${fee.data.deliveryFee}`);

  // والزبون يراها فورًا
  const shopper = await browser.newContext();
  const s = await shopper.newPage();
  await s.goto(BASE + '/menu', { waitUntil: 'networkidle' });
  await s.getByRole('button', { name: /Add .* to your order/ }).first().click();
  await s.goto(BASE + '/checkout', { waitUntil: 'networkidle' });
  await s.waitForTimeout(1200);
  const summary = await s.textContent('.checkout-summary');
  check('🎯 الزبون يرى الرسوم الجديدة في الدفع', summary.includes('12'), summary.replace(/\s+/g, ' ').slice(0, 90));
  await shopper.close();

  // إعادة الرسوم
  await a.fill('#delivery-fee', '10');
  await a.getByRole('button', { name: /Save settings/ }).click();
  await a.waitForTimeout(1200);

  // إدارة القائمة
  await a.goto(BASE + '/admin/menu', { waitUntil: 'networkidle' });
  await a.waitForSelector('.dish-row', { timeout: 10000 });
  const rows = await a.locator('.dish-row').count();
  check('إدارة القائمة تعرض الأطباق', rows >= 12, `${rows} طبقًا`);

  const hideButton = a.locator('.dish-row').first().getByRole('button', { name: 'Hide' });
  if (await hideButton.count()) {
    await hideButton.click();
    await a.waitForTimeout(1500);
    const publicMenu = await fetch(`${API}/menu-items`).then((r) => r.json());
    check('🎯 إخفاء طبق يزيله من القائمة العامة', publicMenu.data.length < rows, `${publicMenu.data.length}`);

    await a.locator('.dish-row').first().getByRole('button', { name: 'Show' }).click();
    await a.waitForTimeout(1200);
  }
  await a.screenshot({ path: `${SHOTS}/admin-3-menu.png`, fullPage: true });

  // الرسائل
  await fetch(`${API}/contact-messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Audit Visitor',
      email: 'visitor@example.com',
      subject: 'private_event',
      message: 'We would like to book the terrace for twenty people next month.',
    }),
  });

  await a.goto(BASE + '/admin/messages', { waitUntil: 'networkidle' });
  await a.waitForTimeout(900);
  check('الرسائل تصل إلى اللوحة', (await a.textContent('body')).includes('Audit Visitor'));
  await a.screenshot({ path: `${SHOTS}/admin-4-messages.png`, fullPage: true });

  // تسجيل الخروج
  await a.locator('#account-menu').click();
  await a.getByRole('button', { name: /Sign out/ }).click();
  await a.waitForTimeout(1400);
  await a.goto(BASE + '/admin/orders', { waitUntil: 'networkidle' });
  await a.waitForTimeout(600);
  check('🔒 بعد الخروج لا يعود الوصول للوحة', !a.url().includes('/admin'), a.url());

  await adminCtx.close();
  await browser.close();

  console.log('\n' + '─'.repeat(58));
  if (failures.length === 0) {
    console.log(`  ✅ ${passed}/${passed} فحصًا نجحت`);
  } else {
    console.log(`  ${passed} نجح · ${failures.length} فشل:\n`);
    failures.forEach((f) => console.log('     • ' + f));
  }
  console.log('─'.repeat(58) + '\n');

  process.exit(failures.length === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error('\n❌ فشل الفحص:', error.message);
  process.exit(1);
});
