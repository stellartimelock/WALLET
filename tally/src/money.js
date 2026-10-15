export function cents(value) {
  const n = typeof value === 'number' ? value : Number(String(value).replace(/[$,\s]/g, ''));
  if (!Number.isFinite(n)) throw new Error('Enter a valid amount');
  return Math.round(n * 100);
}

export function fromCents(c) {
  return c / 100;
}

export function formatMoney(c, currency = 'USD') {
  const amount = fromCents(c);
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

export function parseMoney(value) {
  if (typeof value === 'number') return requireNonNegative(cents(value));
  const text = String(value ?? '').trim();
  if (!text) return 0;
  return requireNonNegative(cents(text));
}

function requireNonNegative(c) {
  if (c < 0) throw new Error('Amounts cannot be negative');
  if (c > 100_000_000_000) throw new Error('Amount is too large');
  return c;
}

export function splitEven(totalCents) {
  const first = Math.floor(totalCents / 2);
  return [first, totalCents - first];
}
