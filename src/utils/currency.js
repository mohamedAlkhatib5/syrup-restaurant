const formatter = new Intl.NumberFormat('en-AE', {
  style: 'currency',
  currency: 'AED',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** يعرض المبلغ بصيغة موحّدة في كل الموقع، مثل: AED 58. */
export function formatPrice(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? formatter.format(amount) : formatter.format(0);
}
