import { describe, it, expect } from "vitest";
import { Dates } from "../../src/common/dates/dates.js";

describe("Dates Utility & Month-End Clamping", () => {
  it("should accurately clamp Jan 31 + 1 month to Feb 28 in non-leap year", () => {
    // 2025 is not a leap year -> Feb has 28 days
    const jan31 = Dates.fromDateString("2025-01-31");
    const febNext = Dates.addBillingPeriod(jan31, "MONTHLY", 1);

    expect(Dates.toDateString(febNext)).toBe("2025-02-28");
  });

  it("should accurately clamp Jan 31 + 1 month to Feb 29 in leap year", () => {
    // 2024 is a leap year -> Feb has 29 days
    const jan31 = Dates.fromDateString("2024-01-31");
    const febNext = Dates.addBillingPeriod(jan31, "MONTHLY", 1);

    expect(Dates.toDateString(febNext)).toBe("2024-02-29");
  });

  it("should clamp 31-day months to 30-day months (e.g. March 31 -> April 30)", () => {
    const mar31 = Dates.fromDateString("2025-03-31");
    const aprNext = Dates.addBillingPeriod(mar31, "MONTHLY", 1);

    expect(Dates.toDateString(aprNext)).toBe("2025-04-30");
  });

  it("should correctly advance by DAILY and WEEKLY intervals", () => {
    const base = Dates.fromDateString("2025-05-10");

    const daily = Dates.addBillingPeriod(base, "DAILY", 1);
    expect(Dates.toDateString(daily)).toBe("2025-05-11");

    const weekly = Dates.addBillingPeriod(base, "WEEKLY", 2); // 14 days
    expect(Dates.toDateString(weekly)).toBe("2025-05-24");
  });

  it("should correctly advance by YEARLY interval with leap day clamping", () => {
    const leapFeb29 = Dates.fromDateString("2024-02-29");
    const nextYear = Dates.addBillingPeriod(leapFeb29, "YEARLY", 1);

    // 2025 is not a leap year -> clamps to Feb 28
    expect(Dates.toDateString(nextYear)).toBe("2025-02-28");
  });

  it("should detect leap years correctly", () => {
    expect(Dates.isLeapYear(2024)).toBe(true);
    expect(Dates.isLeapYear(2025)).toBe(false);
    expect(Dates.isLeapYear(2000)).toBe(true);
    expect(Dates.isLeapYear(1900)).toBe(false);
  });

  it("should compute day difference accurately", () => {
    const d1 = Dates.fromDateString("2025-01-01");
    const d2 = Dates.fromDateString("2025-01-15");
    expect(Dates.diffDays(d1, d2)).toBe(14);
  });
});
