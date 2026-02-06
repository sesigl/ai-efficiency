import type { Money } from "./Money.js";

export class ScheduledPrice {
  private constructor(
    private readonly price: Money,
    private readonly effectiveDate: Date,
  ) {}

  static create(price: Money, effectiveDate: Date): ScheduledPrice {
    if (price.isZero()) {
      throw new Error("Scheduled price cannot be zero");
    }
    return new ScheduledPrice(price, effectiveDate);
  }

  getPrice(): Money {
    return this.price;
  }

  getEffectiveDate(): Date {
    return this.effectiveDate;
  }

  isEffectiveAt(date: Date): boolean {
    return date >= this.effectiveDate;
  }
}
