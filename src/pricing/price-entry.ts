import type { Promotion } from "./promotion.js";

export class PriceEntry {
  private promotions: Promotion[] = [];

  constructor(
    public readonly sku: string,
    private basePriceInCents: number,
    private currency: string = "USD",
  ) {
    if (basePriceInCents === 0) {
      throw new Error("Base price cannot be zero");
    }
  }

  getBasePriceInCents(): number {
    return this.basePriceInCents;
  }

  getCurrency(): string {
    return this.currency;
  }

  getPromotions(): Promotion[] {
    return [...this.promotions];
  }

  updatePrice(priceInCents: number, currency?: string): void {
    if (priceInCents === 0) {
      throw new Error("Base price cannot be zero");
    }
    this.basePriceInCents = priceInCents;
    if (currency) {
      this.currency = currency;
    }
  }

  addPromotion(promotion: Promotion): void {
    const exists = this.promotions.some((p) => p.name === promotion.name);
    if (exists) {
      throw new Error("Promotion already exists");
    }
    this.promotions.push(promotion);
  }

  removePromotion(promotionName: string): void {
    this.promotions = this.promotions.filter((p) => p.name !== promotionName);
  }
}
