export class Dates {
  /**
   * Formats a Date object into a pure ISO calendar date string: YYYY-MM-DD.
   */
  static toDateString(d: Date = new Date()): string {
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  /**
   * Parse a YYYY-MM-DD string into a pure UTC Date (at 00:00:00.000Z).
   */
  static fromDateString(dateStr: string): Date {
    const parts = dateStr.split("-");
    if (parts.length !== 3) {
      throw new Error(
        `Invalid date string format: ${dateStr}. Expected YYYY-MM-DD.`,
      );
    }
    const year = parseInt(parts[0]!, 10);
    const month = parseInt(parts[1]!, 10) - 1;
    const day = parseInt(parts[2]!, 10);
    return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  }

  /**
   * Determines if a given year is a leap year.
   */
  static isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  /**
   * Returns the maximum number of days in a given year and month (1-indexed).
   */
  static daysInMonth(year: number, month: number): number {
    return new Date(Date.UTC(year, month, 0)).getUTCDate();
  }

  /**
   * Month-End Clamped Addition:
   * Adds specified number of months to a date, clamping the day of the month
   * if the target month has fewer days than the source date day.
   * e.g. Jan 31 + 1 month -> Feb 28 (or Feb 29 in leap year).
   */
  static addMonthsClamped(date: Date, months: number): Date {
    const d = new Date(date.getTime());
    const originalDay = d.getUTCDate();
    const targetMonthIndex = d.getUTCMonth() + months;

    // Set day to 1 temporarily to avoid automatic overflow during month jumping
    d.setUTCDate(1);
    d.setUTCMonth(targetMonthIndex);

    // Get max days available in the resolved target month
    const maxDays = this.daysInMonth(d.getUTCFullYear(), d.getUTCMonth() + 1);

    // Clamp to minimum of originalDay and maxDays in target month
    const clampedDay = Math.min(originalDay, maxDays);
    d.setUTCDate(clampedDay);

    return d;
  }

  /**
   * Adds billing period to a date based on interval:
   * DAILY, WEEKLY, MONTHLY, YEARLY.
   */
  static addBillingPeriod(
    startDate: Date,
    interval: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY",
    count = 1,
  ): Date {
    const d = new Date(startDate.getTime());
    switch (interval) {
      case "DAILY":
        d.setUTCDate(d.getUTCDate() + count);
        return d;
      case "WEEKLY":
        d.setUTCDate(d.getUTCDate() + count * 7);
        return d;
      case "MONTHLY":
        return this.addMonthsClamped(d, count);
      case "YEARLY":
        return this.addMonthsClamped(d, count * 12);
      default:
        throw new Error(`Unsupported billing interval: ${String(interval)}`);
    }
  }

  /**
   * Adds calendar days to a date.
   */
  static addDays(date: Date, days: number): Date {
    const d = new Date(date.getTime());
    d.setUTCDate(d.getUTCDate() + days);
    return d;
  }

  /**
   * Returns difference in whole calendar days (d2 - d1).
   */
  static diffDays(d1: Date, d2: Date): number {
    const msPerDay = 1000 * 60 * 60 * 24;
    const utc1 = Date.UTC(
      d1.getUTCFullYear(),
      d1.getUTCMonth(),
      d1.getUTCDate(),
    );
    const utc2 = Date.UTC(
      d2.getUTCFullYear(),
      d2.getUTCMonth(),
      d2.getUTCDate(),
    );
    return Math.floor((utc2 - utc1) / msPerDay);
  }

  /**
   * Compares whether d1 is before d2 (ignoring time of day).
   */
  static isBeforeDate(d1: Date, d2: Date): boolean {
    const s1 = this.toDateString(d1);
    const s2 = this.toDateString(d2);
    return s1 < s2;
  }

  /**
   * Compares whether d1 is after d2 (ignoring time of day).
   */
  static isAfterDate(d1: Date, d2: Date): boolean {
    const s1 = this.toDateString(d1);
    const s2 = this.toDateString(d2);
    return s1 > s2;
  }
}
