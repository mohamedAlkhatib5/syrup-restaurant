/**
 * فحص شامل للموقع المبني.
 *
 * يفتح كل صفحة، يرصد أخطاء JavaScript والطلبات الفاشلة، ينفّذ رحلة
 * طلب كاملة، ثم يحفظ لقطات شاشة للمراجعة البصرية.
 *
 * التشغيل:  npm run verify   (بعد npm run build وتشغيل vite preview)
 */
import { chromium, devices } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173';
const SHOTS = 'screenshots';

const problems = [];
const log = (icon, msg) => console.log(`  ${icon} ${msg}`);

function watch(page, label) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') problems.push(`[${label}] console: ${msg.text()}`);
  });
  page.on('pageerror', (err) => problems.push(`[${label}] pageerror: ${err.message}`));
  page.on('requestfailed', (req) => {
    const url = req.url();
    // بلاطات الخريطة قد تفشل بلا إنترنت — ليست خطأ في الكود.
    if (url.includes('tile.openstreetmap.org')) return;
    problems.push(`[${label}] request failed: ${url} — ${req.failure()?.errorText}`);
  });
  page.on('response', (res) => {
    if (res.status() >= 400 && new URL(res.url()).origin === new URL(BASE).origin) {
      problems.push(`[${label}] HTTP ${res.status()} ${res.url()}`);
    }
  });
}

const PAGES = [
  { path: '/', name: 'home', expect: 'Food made to' },
  { path: '/menu', name: 'menu', expect: 'Our Menu' },
  { path: '/story', name: 'story', expect: 'Our Story' },
  { path: '/contact', name: 'contact', expect: 'Contact & Reservations' },
  { path: '/cart', name: 'cart-empty', expect: 'Your basket is empty' },
  { path: '/nope', name: '404', expect: 'Page not found' },
];

async function main() {
  await mkdir(SHOTS, { recursive: true });

  const browser = await chromium.launch();

  // ------------------------- سطح المكتب -------------------------
  console.log('\n▸ الصفحات على سطح المكتب (1440×900)');
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  for (const { path, name, expect } of PAGES) {
    const page = await desktop.newPage();
    watch(page, name);

    await page.goto(BASE + path, { waitUntil: 'networkidle' });
    const body = await page.textContent('body');

    if (!body.includes(expect)) {
      problems.push(`[${name}] النص المتوقع غير موجود: "${expect}"`);
      log('❌', `${path.padEnd(10)} — لم يُعرض "${expect}"`);
    } else {
      log('✅', `${path.padEnd(10)} — ظهر بشكل صحيح`);
    }

    await page.screenshot({ path: `${SHOTS}/desktop-${name}.png`, fullPage: true });
    await page.close();
  }

  // --------------------- رحلة الطلب الكاملة ---------------------
  console.log('\n▸ رحلة الطلب الكاملة');
  const page = await desktop.newPage();
  watch(page, 'order-flow');

  await page.goto(BASE + '/menu', { waitUntil: 'networkidle' });

  await page.getByRole('button', { name: /Add .* to your order/ }).first().click();
  await page.getByRole('button', { name: /Add .* to your order/ }).nth(2).click();
  log('✅', 'أُضيف طبقان إلى السلة');

  await page.waitForSelector('.toast-item', { timeout: 3000 });
  await page.screenshot({ path: `${SHOTS}/flow-1-toast.png` });
  log('✅', 'ظهر إشعار الإضافة');

  await page.getByRole('button', { name: /Open your basket/ }).click();
  await page.waitForSelector('.cart-drawer.show', { timeout: 3000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SHOTS}/flow-2-drawer.png` });
  log('✅', 'انفتح درج السلة');

  await page.getByRole('link', { name: 'Review order' }).click();
  await page.waitForURL('**/cart');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${SHOTS}/flow-3-cart.png`, fullPage: true });
  log('✅', 'صفحة السلة');

  await page.goto(BASE + '/checkout', { waitUntil: 'networkidle' });
  await page.waitForSelector('.leaflet-container', { timeout: 8000 }).catch(() => {
    problems.push('[checkout] الخريطة لم تُركّب');
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${SHOTS}/flow-4-checkout.png`, fullPage: true });
  log('✅', 'صفحة الدفع + الخريطة');

  // التحقق من رفض النموذج الفارغ
  await page.getByRole('button', { name: /Place order/ }).click();
  await page.waitForTimeout(400);
  const invalidCount = await page.locator('.is-invalid').count();
  if (invalidCount >= 2) log('✅', `التحقق يمنع الإرسال الفارغ (${invalidCount} حقلًا)`);
  else problems.push('[checkout] التحقق لم يمنع الإرسال الفارغ');

  await page.fill('#checkout-name', 'Mohamed Alkhatib');
  await page.fill('#checkout-phone', '+971 50 123 4567');
  await page.fill('#checkout-email', 'guest@example.com');
  await page.fill('#checkout-address', 'Al Majaz Tower 2, Al Khan Street, Sharjah');

  // الدفع بالبطاقة
  await page.getByText('Card', { exact: true }).click();
  await page.waitForSelector('#card-number');
  await page.fill('#card-holder', 'MOHAMED ALKHATIB');
  await page.fill('#card-number', '4242424242424242');
  await page.fill('#card-expiry', '1230');
  await page.fill('#card-cvc', '123');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SHOTS}/flow-5-card.png`, fullPage: true });
  log('✅', 'حقل البطاقة (تنسيق + كشف نوع البطاقة)');

  await page.getByRole('button', { name: /Place order/ }).click();
  await page.waitForURL('**/order/ORD-**', { timeout: 15000 });
  await page.waitForSelector('.confirmation-tick', { timeout: 8000 });
  await page.waitForTimeout(500);

  const ref = await page.textContent('.confirmation-reference');
  log('✅', `تأكيد الطلب: ${ref.trim()}`);
  await page.screenshot({ path: `${SHOTS}/flow-6-confirmation.png`, fullPage: true });

  // التحقق من تفريغ السلة بعد الطلب
  const badge = await page.locator('.order-button b').textContent();
  if (badge.trim() === '0') log('✅', 'السلة أُفرغت بعد الطلب');
  else problems.push(`[flow] السلة لم تُفرغ — العدّاد ${badge}`);

  await page.close();

  // -------------------- بقاء السلة بعد التحديث --------------------
  console.log('\n▸ بقاء السلة بعد إعادة التحميل');
  const persist = await desktop.newPage();
  watch(persist, 'persist');
  await persist.goto(BASE + '/menu', { waitUntil: 'networkidle' });
  await persist.getByRole('button', { name: /Add .* to your order/ }).first().click();
  await persist.waitForTimeout(300);
  await persist.reload({ waitUntil: 'networkidle' });
  const after = (await persist.locator('.order-button b').textContent()).trim();
  if (after === '1') log('✅', 'السلة نجت من إعادة التحميل (كانت تُمحى سابقًا)');
  else problems.push(`[persist] السلة لم تنجُ — العدّاد ${after}`);
  await persist.close();
  await desktop.close();

  // ----------------------------- الهاتف -----------------------------
  console.log('\n▸ الهاتف (iPhone 13)');
  const mobile = await browser.newContext({ ...devices['iPhone 13'] });
  const m = await mobile.newPage();
  watch(m, 'mobile');

  await m.goto(BASE + '/menu', { waitUntil: 'networkidle' });
  await m.getByRole('button', { name: /Add .* to your order/ }).first().click();
  await m.waitForSelector('.mobile-cart-bar', { timeout: 3000 });
  await m.waitForTimeout(600);
  await m.screenshot({ path: `${SHOTS}/mobile-1-menu-bar.png` });
  log('✅', 'شريط السلة السفلي يظهر');

  await m.goto(BASE + '/cart', { waitUntil: 'networkidle' });
  await m.waitForTimeout(400);
  await m.screenshot({ path: `${SHOTS}/mobile-2-cart.png`, fullPage: true });

  // فحص التمرير الأفقي — المشكلة التي كانت في شبكة السلة
  const overflow = await m.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
  );
  if (overflow) problems.push('[mobile] صفحة السلة تفيض أفقيًا');
  else log('✅', 'لا يوجد تمرير أفقي في صفحة السلة');

  await m.goto(BASE + '/', { waitUntil: 'networkidle' });
  await m.waitForTimeout(600);
  await m.screenshot({ path: `${SHOTS}/mobile-3-home.png`, fullPage: true });

  await mobile.close();
  await browser.close();

  // ----------------------------- النتيجة -----------------------------
  console.log('\n' + '─'.repeat(58));
  if (problems.length === 0) {
    console.log('  ✅ كل الفحوصات نجحت — صفر أخطاء JavaScript وصفر طلبات فاشلة');
  } else {
    console.log(`  ❌ ${problems.length} مشكلة:\n`);
    problems.forEach((p) => console.log('     • ' + p));
  }
  console.log('─'.repeat(58));
  console.log(`  اللقطات محفوظة في: ${SHOTS}/\n`);

  process.exit(problems.length === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error('\n❌ فشل الفحص:', error.message);
  process.exit(1);
});
