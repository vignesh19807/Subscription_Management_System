import { Decimal } from "decimal.js";

// Configure Decimal globally for financial operations:
// 20 digits of precision for intermediate calculations, ROUND_HALF_UP (standard commercial rounding)
Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -7,
  toExpPos: 21,
});

export type NumericInput = string | number | Decimal | { toString(): string };

export class Money {
  /**
   * Safely coerce any numeric input into a Decimal instance.
   */
  static toDecimal(val: NumericInput): Decimal {
    if (val instanceof Decimal) {
      return val;
    }
    if (typeof val === "number") {
      return new Decimal(val.toString());
    }
    if (typeof val === "string") {
      return new Decimal(val.trim() === "" ? "0" : val);
    }
    if (
      val !== null &&
      typeof val === "object" &&
      typeof (val as { toString: () => string }).toString === "function"
    ) {
      return new Decimal((val as { toString: () => string }).toString());
    }
    return new Decimal(0);
  }

  /**
   * Round to exactly 2 decimal places using ROUND_HALF_UP.
   */
  static round(val: NumericInput): Decimal {
    return this.toDecimal(val).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  }

  /**
   * Addition (a + b) rounded to 2 decimal places.
   */
  static add(a: NumericInput, b: NumericInput): Decimal {
    return this.round(this.toDecimal(a).plus(this.toDecimal(b)));
  }

  /**
   * Subtraction (a - b) rounded to 2 decimal places.
   */
  static subtract(a: NumericInput, b: NumericInput): Decimal {
    return this.round(this.toDecimal(a).minus(this.toDecimal(b)));
  }

  /**
   * Multiplication (a * b) rounded to 2 decimal places.
   */
  static multiply(a: NumericInput, b: NumericInput): Decimal {
    return this.round(this.toDecimal(a).times(this.toDecimal(b)));
  }

  /**
   * Division (a / b) rounded to 2 decimal places.
   */
  static divide(a: NumericInput, b: NumericInput): Decimal {
    const divisor = this.toDecimal(b);
    if (divisor.isZero()) {
      throw new Error(
        "Division by zero is not allowed in financial operations.",
      );
    }
    return this.round(this.toDecimal(a).dividedBy(divisor));
  }

  /**
   * Authoritative Unit Price Formula:
   * Unit Price = Product Base Sales Price + Variant Price Delta
   * e.g. Base ₹1000 + Variant Delta ₹560 = ₹1560
   */
  static calculateUnitPrice(
    basePrice: NumericInput,
    variantDelta: NumericInput = 0,
  ): Decimal {
    const base = this.round(basePrice);
    const delta = this.round(variantDelta);
    if (base.isNegative()) {
      throw new Error("Base sales price cannot be negative.");
    }
    const unitPrice = this.add(base, delta);
    if (unitPrice.isNegative()) {
      throw new Error("Final unit price cannot be negative.");
    }
    return unitPrice;
  }

  /**
   * Authoritative Line Item Financial Calculation:
   * 1. gross = unitPrice × quantity
   * 2. discount = min(eligibleDiscount, gross)
   * 3. taxable = max(0, gross - discount)
   * 4. tax = taxable × (taxRate / 100)
   * 5. lineTotal = taxable + tax
   *
   * Each calculation stage is rounded to 2 decimal places using ROUND_HALF_UP.
   */
  static calculateLineItem(
    unitPriceInput: NumericInput,
    quantity: number,
    eligibleDiscountInput: NumericInput = 0,
    taxRatePercentageInput: NumericInput = 0,
  ): {
    unitPrice: Decimal;
    gross: Decimal;
    discount: Decimal;
    taxable: Decimal;
    taxRate: Decimal;
    tax: Decimal;
    lineTotal: Decimal;
    // Canonical aliases for consumers
    grossAmount: Decimal;
    discountAmount: Decimal;
    subtotal: Decimal;
    taxAmount: Decimal;
  } {
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new Error(
        "Line item quantity must be an integer greater than or equal to 1.",
      );
    }

    const unitPrice = this.round(unitPriceInput);
    if (unitPrice.isNegative()) {
      throw new Error("Unit price cannot be negative.");
    }

    const eligibleDiscount = this.round(eligibleDiscountInput);
    if (eligibleDiscount.isNegative()) {
      throw new Error("Discount amount cannot be negative.");
    }

    const taxRate = this.round(taxRatePercentageInput);
    if (taxRate.isNegative()) {
      throw new Error("Tax rate cannot be negative.");
    }

    // Stage 1: gross = unitPrice × quantity
    const gross = this.round(unitPrice.times(quantity));

    // Stage 2: discount = min(eligibleDiscount, gross)
    const discount = this.round(Decimal.min(eligibleDiscount, gross));

    // Stage 3: taxable = max(0, gross - discount)
    const taxable = this.round(Decimal.max(0, gross.minus(discount)));

    // Stage 4: tax = taxable × taxRate / 100
    const tax = this.round(taxable.times(taxRate).dividedBy(new Decimal(100)));

    // Stage 5: lineTotal = taxable + tax
    const lineTotal = this.round(taxable.plus(tax));

    return {
      unitPrice,
      gross,
      discount,
      taxable,
      taxRate,
      tax,
      lineTotal,
      // Aliases
      grossAmount: gross,
      discountAmount: discount,
      subtotal: taxable,
      taxAmount: tax,
    };
  }

  /**
   * Comparison helpers
   */
  static isZero(val: NumericInput): boolean {
    return this.toDecimal(val).isZero();
  }

  static isPositive(val: NumericInput): boolean {
    return this.toDecimal(val).isPositive() && !this.isZero(val);
  }

  static greaterThan(a: NumericInput, b: NumericInput): boolean {
    return this.toDecimal(a).greaterThan(this.toDecimal(b));
  }

  static greaterThanOrEqualTo(a: NumericInput, b: NumericInput): boolean {
    return this.toDecimal(a).greaterThanOrEqualTo(this.toDecimal(b));
  }

  static lessThan(a: NumericInput, b: NumericInput): boolean {
    return this.toDecimal(a).lessThan(this.toDecimal(b));
  }

  static equals(a: NumericInput, b: NumericInput): boolean {
    return this.round(a).equals(this.round(b));
  }

  /**
   * Formats a monetary amount into a clean 2-decimal string representation.
   */
  static toString(val: NumericInput): string {
    return this.round(val).toFixed(2);
  }

  /**
   * Format as currency string (e.g. ₹1,560.00)
   */
  static formatINR(val: NumericInput): string {
    const fixed = this.round(val).toFixed(2);
    const [intPart, decPart] = fixed.split(".");
    const lastThree = intPart!.slice(-3);
    const otherNumbers = intPart!.slice(0, -3);
    const formattedInt =
      otherNumbers !== ""
        ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree
        : lastThree;
    return `₹${formattedInt}.${decPart}`;
  }
}
