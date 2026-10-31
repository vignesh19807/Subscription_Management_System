import Decimal from 'decimal.js';

// Configure Decimal.js for financial arithmetic
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export function toDecimal(value: string | number | Decimal): Decimal {
  if (value instanceof Decimal) return value;
  return new Decimal(value || 0);
}

export function formatINR(value: string | number | Decimal): string {
  const dec = toDecimal(value);
  const formatted = dec.toFixed(2);
  const parts = formatted.split('.');
  const intPart = parts[0] ?? '0';
  const decPart = parts[1] ?? '00';

  // Format Indian Numbering System: e.g. 1,00,000.00
  const isNegative = intPart.startsWith('-');
  const absInt = isNegative ? intPart.slice(1) : intPart;

  let result = '';
  if (absInt.length <= 3) {
    result = absInt;
  } else {
    const lastThree = absInt.substring(absInt.length - 3);
    const otherNumbers = absInt.substring(0, absInt.length - 3);
    const withCommas = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    result = `${withCommas},${lastThree}`;
  }

  return `${isNegative ? '-' : ''}₹${result}.${decPart}`;
}

export function addCurrency(a: string | number | Decimal, b: string | number | Decimal): Decimal {
  return toDecimal(a).plus(toDecimal(b));
}

export function subtractCurrency(a: string | number | Decimal, b: string | number | Decimal): Decimal {
  return toDecimal(a).minus(toDecimal(b));
}

export function multiplyCurrency(a: string | number | Decimal, quantity: number | string): Decimal {
  return toDecimal(a).times(toDecimal(quantity));
}
