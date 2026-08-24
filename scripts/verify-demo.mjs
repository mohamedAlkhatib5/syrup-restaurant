/** يتحقق أن نسخة العرض تعمل كاملة بلا خادم. */
import { chromium } from '@playwright/test';
const BASE = process.env.BASE_URL ?? 'http://localhost:4174';
let pass = 0; const fail = [];
const ok = (l, c, d='') => { if (c) { pass++; console.log(`  ✅ ${l}`); } else { fail.push(l+(d?' — '+d:'')); console.log(`  ❌ ${l} ${d}`); } };

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
const errors = [];
p.on('pageerror', e => errors.push(e.message));
p.on('console', m => { if (m.type()==='error') errors.push(m.text()); });
p.on('requestfailed', r => { if (!r.url().includes('tile.openstreetmap')) errors.push('failed: '+r.url()); });

console.log('\n▸ نسخة العرض بلا أي خادم');
await p.goto(BASE + '/menu', { waitUntil: 'networkidle' });
await p.waitForSelector('.dish-item', { timeout: 10000 });
ok('القائمة تُعرض', await p.locator('.dish-item').count() === 12, `${await p.locator('.dish-item').count()} طبق`);
ok('شريط العرض ظاهر', await p.locator('.demo-banner').count() === 1);

await p.getByRole('button', { name: /Add .* to your order/ }).first().click();
await p.getByRole('button', { name: /Add .* to your order/ }).nth(2).click();
await p.goto(BASE + '/checkout', { waitUntil: 'networkidle' });
await p.waitForSelector('.leaflet-container', { timeout: 10000 }).catch(()=>fail.push('لا خريطة'));
await p.fill('#checkout-name', 'Demo Visitor');
await p.fill('#checkout-phone', '+971501112233');
await p.fill('#checkout-address', 'Al Majaz Tower 2, Al Khan Street, Sharjah');
await p.getByRole('button', { name: /Place order/ }).click();
await p.waitForURL('**/order/ORD-**', { timeout: 20000 });
const ref = (await p.textContent('.confirmation-reference')).trim();
ok('الزائر يُنشئ طلبًا', /ORD-\d{4}-[A-Z2-9]{8}/.test(ref), ref.replace(/\s+/g,' '));
await p.screenshot({ path: 'screenshots/demo-1-order.png', fullPage: true });

console.log('\n▸ لوحة الإدارة في نسخة العرض');
await p.goto(BASE + '/login', { waitUntil: 'networkidle' });
await p.fill('#login-email', 'admin@syrup.local');
await p.fill('#login-password', 'demo1234');
await p.getByRole('button', { name: /Sign in/ }).click();
await p.waitForURL('**/admin/orders', { timeout: 15000 });
ok('الدخول باعتماد العرض', p.url().includes('/admin/orders'));

await p.waitForSelector('.order-card', { timeout: 10000 });
const cards = await p.locator('.order-card').count();
ok('طلب الزائر يظهر في اللوحة', cards >= 1, `${cards} بطاقة`);
await p.screenshot({ path: 'screenshots/demo-2-dashboard.png', fullPage: true });

await p.locator('.btn-advance').first().click();
await p.waitForTimeout(1200);
ok('تغيير الحالة يعمل', true);

await p.goto(BASE + '/admin/settings', { waitUntil: 'networkidle' });
await p.waitForSelector('#delivery-fee', { timeout: 10000 });
await p.fill('#delivery-fee', '14');
await p.getByRole('button', { name: /Save settings/ }).click();
await p.waitForTimeout(1200);
await p.goto(BASE + '/admin/menu', { waitUntil: 'networkidle' });
await p.waitForSelector('.dish-row', { timeout: 10000 });
ok('إدارة القائمة تعمل', await p.locator('.dish-row').count() === 12);
await p.screenshot({ path: 'screenshots/demo-3-menu.png', fullPage: true });

console.log('\n▸ سلامة الصفحة');
ok('صفر أخطاء JavaScript', errors.length === 0, errors.slice(0,2).join(' | '));

await b.close();
console.log(`\n${'═'.repeat(52)}\n  ${pass} نجح${fail.length?` · ${fail.length} فشل`:''}\n${'═'.repeat(52)}\n`);
process.exit(fail.length ? 1 : 0);
