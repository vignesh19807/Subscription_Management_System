import { describe, it, expect } from "vitest";
import { Money } from "../../src/common/money/money.js";
import { Decimal } from "decimal.js";

describe("Money Utility & Authoritative Financial Calculations", () => {
  it("should round numbers to 2 decimal places using ROUND_HALF_UP", () => {
    expect(Money.round("10.555").toFixed(2)).toBe("10.56");
    expect(Money.round("10.554").toFixed(2)).toBe("10.55");
    expect(Money.round("10.5550000").toFixed(2)).toBe("10.56");
    expect(Money.round(10.505).toFixed(2)).toBe("10.51");
    expect(Money.toString("10.555")).toBe("10.56");
  });

  it("should handle rounding boundaries correctly (0.005 -> 0.01, 0.004 -> 0.00)", () => {
    expect(Money.round("0.005").toFixed(2)).toBe("0.01");
    expect(Money.round("0.004").toFixed(2)).toBe("0.00");
    expect(Money.round("1.005").toFixed(2)).toBe("1.01");
    expect(Money.round("1.004").toFixed(2)).toBe("1.00");
  });

  it("should perform exact addition and subtraction without binary floating point drift", () => {
    // Classic JavaScript float bug: 0.1 + 0.2 = 0.30000000000000004
    expect(Money.add(0.1, 0.2).toFixed(2)).toBe("0.30");
    expect(Money.subtract("100.00", "33.33").toFixed(2)).toBe("66.67");
  });

  it("should calculate authoritative unit price with variant surcharge delta (+₹560 benchmark)", () => {
    // Benchmark from Master Specification:
    // Base sales price: ₹1,000.00
    // Odoo variant surcharge delta: +₹560.00
    // Authoritative unit price: ₹1,560.00
    const basePrice = 1000.0;
    const odooVariantDelta = 560.0;
    const unitPrice = Money.calculateUnitPrice(basePrice, odooVariantDelta);

    expect(unitPrice.toFixed(2)).toBe("1560.00");
    expect(Money.toString(unitPrice)).toBe("1560.00");
    expect(unitPrice instanceof Decimal).toBe(true);
  });

  it("should execute authoritative benchmark: 20 × ₹1,560 with 10% discount and 18% tax = exactly ₹33,134.40", () => {
    // Exact Master Specification Test:
    // 1. unitPrice = ₹1,560.00
    // 2. quantity = 20
    // 3. gross = 20 × ₹1,560.00 = ₹31,200.00
    // 4. 10% discount on gross = ₹31,200.00 × 0.10 = ₹3,120.00
    // 5. discount = min(3120, 31200) = ₹3,120.00
    // 6. taxable = max(0, 31200 - 3120) = ₹28,080.00
    // 7. tax = ₹28,080.00 × 18% = ₹5,054.40
    // 8. lineTotal = ₹28,080.00 + ₹5,054.40 = ₹33,134.40
    const unitPrice = 1560.0;
    const quantity = 20;
    const eligibleDiscount = 3120.0; // 10% of ₹31,200
    const taxRate = 18.0;

    const result = Money.calculateLineItem(
      unitPrice,
      quantity,
      eligibleDiscount,
      taxRate,
    );

    expect(result.unitPrice.toFixed(2)).toBe("1560.00");
    expect(result.gross.toFixed(2)).toBe("31200.00");
    expect(result.discount.toFixed(2)).toBe("3120.00");
    expect(result.taxable.toFixed(2)).toBe("28080.00");
    expect(result.taxRate.toFixed(2)).toBe("18.00");
    expect(result.tax.toFixed(2)).toBe("5054.40");
    expect(result.lineTotal.toFixed(2)).toBe("33134.40");
  });

  it("should cap discount to gross when eligible discount is greater than gross", () => {
    // Gross = 1 × 100.00 = 100.00
    // Discount offered = 150.00
    // discount capped at gross (100.00)
    // taxable = max(0, 100 - 100) = 0.00
    // tax = 0.00, lineTotal = 0.00
    const result = Money.calculateLineItem("100.00", 1, "150.00", "18.00");

    expect(result.gross.toFixed(2)).toBe("100.00");
    expect(result.discount.toFixed(2)).toBe("100.00");
    expect(result.taxable.toFixed(2)).toBe("0.00");
    expect(result.tax.toFixed(2)).toBe("0.00");
    expect(result.lineTotal.toFixed(2)).toBe("0.00");
  });

  it("should calculate accurately with zero tax", () => {
    const result = Money.calculateLineItem("500.00", 3, "100.00", "0.00");

    expect(result.gross.toFixed(2)).toBe("1500.00");
    expect(result.discount.toFixed(2)).toBe("100.00");
    expect(result.taxable.toFixed(2)).toBe("1400.00");
    expect(result.tax.toFixed(2)).toBe("0.00");
    expect(result.lineTotal.toFixed(2)).toBe("1400.00");
  });

  it("should calculate accurately with zero discount", () => {
    const result = Money.calculateLineItem("200.00", 2, "0.00", "18.00");

    expect(result.gross.toFixed(2)).toBe("400.00");
    expect(result.discount.toFixed(2)).toBe("0.00");
    expect(result.taxable.toFixed(2)).toBe("400.00");
    expect(result.tax.toFixed(2)).toBe("72.00");
    expect(result.lineTotal.toFixed(2)).toBe("472.00");
  });

  it("should reject invalid and negative inputs", () => {
    // Negative unit price
    expect(() => Money.calculateLineItem("-10.00", 1, "0.00", "18.00")).toThrow(
      "Unit price cannot be negative.",
    );

    // Negative discount
    expect(() => Money.calculateLineItem("10.00", 1, "-5.00", "18.00")).toThrow(
      "Discount amount cannot be negative.",
    );

    // Negative tax rate
    expect(() => Money.calculateLineItem("10.00", 1, "0.00", "-18.00")).toThrow(
      "Tax rate cannot be negative.",
    );

    // Invalid quantities
    expect(() => Money.calculateLineItem("10.00", 0, "0.00", "18.00")).toThrow(
      "Line item quantity must be an integer greater than or equal to 1.",
    );
    expect(() => Money.calculateLineItem("10.00", -2, "0.00", "18.00")).toThrow(
      "Line item quantity must be an integer greater than or equal to 1.",
    );
    expect(() =>
      Money.calculateLineItem("10.00", 1.5, "0.00", "18.00"),
    ).toThrow(
      "Line item quantity must be an integer greater than or equal to 1.",
    );

    // Base price negative in calculateUnitPrice
    expect(() => Money.calculateUnitPrice("-100.00", "50.00")).toThrow(
      "Base sales price cannot be negative.",
    );
  });

  it("should throw error on division by zero", () => {
    expect(() => Money.divide(100, 0)).toThrow(
      "Division by zero is not allowed in financial operations.",
    );
  });

  it("should format amounts cleanly in INR representation", () => {
    expect(Money.formatINR("1560.00")).toBe("₹1,560.00");
    expect(Money.formatINR("100000.50")).toBe("₹1,00,000.50");
    expect(Money.formatINR("10000000.00")).toBe("₹1,00,00,000.00");
    expect(Money.formatINR("33134.40")).toBe("₹33,134.40");
  });
});
