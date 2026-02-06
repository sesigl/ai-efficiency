import type { Promotion } from "./promotion.js";

export interface ScheduledPriceChange {
  priceInCents: number;
  effectiveDate: string;
}

export interface BulkDiscountTier {
  minQuantity: number;
  maxQuantity?: number;
  discountPercentage: number;
}

export class PriceEntry {
  private promotions: Promotion[] = [];
  private scheduledPriceChanges: ScheduledPriceChange[] = [];
  private bulkDiscountTiers: BulkDiscountTier[] = [];

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

  getEffectiveBasePriceInCents(atDate?: Date): number {
    const checkDate = atDate ?? new Date();
    const applicableChanges = this.scheduledPriceChanges
      .filter((change) => new Date(change.effectiveDate) <= checkDate)
      .sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());

    if (applicableChanges.length > 0) {
      return applicableChanges[0]!.priceInCents;
    }
    return this.basePriceInCents;
  }

  addScheduledPriceChange(priceInCents: number, effectiveDate: string): void {
    this.scheduledPriceChanges.push({ priceInCents, effectiveDate });
  }

  setBulkDiscountTiers(tiers: BulkDiscountTier[]): void {
    this.bulkDiscountTiers = tiers;
  }

  getBulkDiscountTiers(): BulkDiscountTier[] {
    return [...this.bulkDiscountTiers];
  }

  getBulkDiscountPercentage(quantity: number): number {
    const matchingTier = this.bulkDiscountTiers.find((tier) => {
      if (tier.maxQuantity !== undefined) {
        return quantity >= tier.minQuantity && quantity <= tier.maxQuantity;
      }
      return quantity >= tier.minQuantity;
    });
    return matchingTier?.discountPercentage ?? 0;
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
