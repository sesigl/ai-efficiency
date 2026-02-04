import type { Money } from "./Money.js";

export class AppliedDiscount {
  constructor(
    public readonly promotionName: string,
    public readonly originalPercentage: number,
    public readonly appliedPercentage: number,
    public readonly reason: string,
  ) {}
}

export class CalculatedPrice {
  constructor(
    public readonly sku: string,
    public readonly basePrice: Money,
    public readonly finalPrice: Money,
    public readonly appliedDiscounts: AppliedDiscount[],
  ) {}

  getTotalDiscountPercentage(): number {
    const baseCents = this.basePrice.getCents();
    if (baseCents === 0) return 0;
    const savedCents = baseCents - this.finalPrice.getCents();
    return Math.round((savedCents / baseCents) * 100);
  }
}
