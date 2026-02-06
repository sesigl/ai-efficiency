import type { Money } from "./Money.js";

export class ScheduledPrice {
  private constructor(
    private readonly price: Money,
    private readonly effectiveDate: Date,
  ) {}

  static create(price: Money, effectiveDate: Date): ScheduledPrice {
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
