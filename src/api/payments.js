/**
 * بوابة دفع محاكاة — محلية بالكامل.
 *
 * لا تتصل بأي خدمة خارجية ولا تحفظ أي بيانات بطاقة. هدفها إتاحة
 * تجربة الدفع كاملة أثناء التطوير.
 *
 * حين تُربط بوابة حقيقية لاحقًا، يبقى هذا الملف هو نقطة التبديل
 * الوحيدة: تُستبدل authorizeCard بنداء البوابة، ولا يتغير أي مكوّن.
 *
 * تحذير مهم: نموذج البطاقة هنا للتطوير فقط. أي تشغيل حقيقي يجب أن
 * يستخدم حقول مستضافة من البوابة (iframe) بحيث لا يمرّ رقم البطاقة
 * عبر هذا التطبيق إطلاقًا.
 */

/** خوارزمية Luhn — نفس ما تستخدمه البنوك للتحقق الأولي من الرقم. */
export function isValidCardNumber(value) {
  const digits = String(value).replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let double = false;

  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }

  return sum % 10 === 0;
}

export function detectCardBrand(value) {
  const digits = String(value).replace(/\D/g, '');
  if (/^4/.test(digits)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'Amex';
  return null;
}

export function isValidExpiry(value) {
  const match = /^(\d{2})\s*\/\s*(\d{2})$/.exec(String(value).trim());
  if (!match) return false;

  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;

  const now = new Date();
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);
  return endOfMonth >= now;
}

/** بطاقات اختبار: أي رقم صالح يُقبل، وهذه الأرقام تُرفض عمدًا. */
const DECLINED_CARDS = new Set(['4000000000000002', '4000000000009995']);

export async function authorizeCard({ number, expiry, cvc, holder }) {
  await new Promise((resolve) => window.setTimeout(resolve, 900));

  const digits = String(number).replace(/\D/g, '');

  if (!holder?.trim()) throw new Error('Cardholder name is required.');
  if (!isValidCardNumber(digits)) throw new Error('That card number is not valid.');
  if (!isValidExpiry(expiry)) throw new Error('That expiry date is not valid.');
  if (!/^\d{3,4}$/.test(String(cvc))) throw new Error('That security code is not valid.');

  if (DECLINED_CARDS.has(digits)) {
    throw new Error('Your card was declined. Please try another card.');
  }

  // لا نُعيد ولا نحفظ أي جزء من البطاقة عدا آخر أربعة أرقام.
  return {
    authorised: true,
    brand: detectCardBrand(digits),
    last4: digits.slice(-4),
    reference: `AUTH-${Math.abs(digits.split('').reduce((a, c) => a * 31 + Number(c), 7)) % 1000000}`,
  };
}
