import Decimal from 'decimal.js';
import { toDecimal, formatINR } from './currency';

export interface LineCalculationInput {
  salesPrice: string | number | Decimal;
  variantDelta?: string | number | Decimal;
  quantity: number | string | Decimal;
  discountAmount?: string | number | Decimal;
  taxRate?: string | number | Decimal; // in percent e.g. 18 for 18%
}

export interface LineCalculationResult {
  unitPrice: Decimal;
  grossAmount: Decimal;
  discountAmount: Decimal;
  taxableAmount: Decimal;
  taxAmount: Decimal;
  lineTotal: Decimal;
  // Formatted strings for display
  formattedUnitPrice: string;
  formattedGross: string;
  formattedDiscount: string;
  formattedTax: string;
  formattedTotal: string;
}

export function calculateLineTotals(input: LineCalculationInput): LineCalculationResult {
  const salesPrice = toDecimal(input.salesPrice);
  const variantDelta = toDecimal(input.variantDelta || 0);
  const qty = toDecimal(input.quantity || 1);
  const requestedDiscount = toDecimal(input.discountAmount || 0);
  const taxRate = toDecimal(input.taxRate || 0);

  // unit_price = sales_price + variant.price_delta
  const unitPrice = salesPrice.plus(variantDelta);

  // gross = unit_price * quantity
  const grossAmount = unitPrice.times(qty);

  // discount = min(eligible_discount, gross)
  const discountAmount = Decimal.min(requestedDiscount, grossAmount);

  // taxable = max(0, gross - discount)
  const taxableAmount = Decimal.max(0, grossAmount.minus(discountAmount));

  // tax = taxable * tax_rate / 100
  const taxAmount = taxableAmount.times(taxRate).dividedBy(100);

  // line_total = taxable + tax
  const lineTotal = taxableAmount.plus(taxAmount);

  return {
    unitPrice: unitPrice.toDecimalPlaces(2, Decimal.ROUND_HALF_UP),
    grossAmount: grossAmount.toDecimalPlaces(2, Decimal.ROUND_HALF_UP),
    discountAmount: discountAmount.toDecimalPlaces(2, Decimal.ROUND_HALF_UP),
    taxableAmount: taxableAmount.toDecimalPlaces(2, Decimal.ROUND_HALF_UP),
    taxAmount: taxAmount.toDecimalPlaces(2, Decimal.ROUND_HALF_UP),
    lineTotal: lineTotal.toDecimalPlaces(2, Decimal.ROUND_HALF_UP),
    formattedUnitPrice: formatINR(unitPrice),
    formattedGross: formatINR(grossAmount),
    formattedDiscount: formatINR(discountAmount),
    formattedTax: formatINR(taxAmount),
    formattedTotal: formatINR(lineTotal),
  };
}

export interface SummaryCalculationResult {
  subtotal: Decimal;
  discountTotal: Decimal;
  taxTotal: Decimal;
  grandTotal: Decimal;
  formattedSubtotal: string;
  formattedDiscountTotal: string;
  formattedTaxTotal: string;
  formattedGrandTotal: string;
}

export function calculateOrderSummary(lines: LineCalculationResult[]): SummaryCalculationResult {
  let subtotal = new Decimal(0);
  let discountTotal = new Decimal(0);
  let taxTotal = new Decimal(0);
  let grandTotal = new Decimal(0);

  for (const line of lines) {
    subtotal = subtotal.plus(line.grossAmount);
    discountTotal = discountTotal.plus(line.discountAmount);
    taxTotal = taxTotal.plus(line.taxAmount);
    grandTotal = grandTotal.plus(line.lineTotal);
  }

  return {
    subtotal: subtotal.toDecimalPlaces(2, Decimal.ROUND_HALF_UP),
    discountTotal: discountTotal.toDecimalPlaces(2, Decimal.ROUND_HALF_UP),
    taxTotal: taxTotal.toDecimalPlaces(2, Decimal.ROUND_HALF_UP),
    grandTotal: grandTotal.toDecimalPlaces(2, Decimal.ROUND_HALF_UP),
    formattedSubtotal: formatINR(subtotal),
    formattedDiscountTotal: formatINR(discountTotal),
    formattedTaxTotal: formatINR(taxTotal),
    formattedGrandTotal: formatINR(grandTotal),
  };
}

