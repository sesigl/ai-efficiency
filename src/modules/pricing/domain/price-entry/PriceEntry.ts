import type { SKU } from "./Sku.js";
import type { Money } from "./Money.js";
import type { Promotion } from "./Promotion.js";
import { CalculatedPrice, AppliedDiscount } from "./CalculatedPrice.js";
import type { AvailabilitySignal } from "../../../../shared/contract/warehouse/AvailabilitySignal.js";
import type { ScheduledPrice } from "./ScheduledPrice.js";
import type { BulkTier } from "./BulkTier.js";

const LOW_STOCK_DISCOUNT_REDUCTION = 0.5;

export class PriceEntry {
  private constructor(
    private readonly sku: SKU,
    private basePrice: Money,
    private promotions: Promotion[],
    private scheduledPrices: ScheduledPrice[],
    private bulkTiers: BulkTier[],
  ) {}

  static create(sku: SKU, basePrice: Money): PriceEntry {
    if (basePrice.isZero()) {
      throw new Error("Base price cannot be zero");
    }
    return new PriceEntry(sku, basePrice, [], [], []);
  }

  getSku(): SKU {
    return this.sku;
  }

  getBasePrice(): Money {
    return this.basePrice;
  }

  getPromotions(): readonly Promotion[] {
    return [...this.promotions];
  }

  getBulkTiers(): readonly BulkTier[] {
    return [...this.bulkTiers];
  }

  setBasePrice(price: Money): void {
    if (price.isZero()) {
      throw new Error("Base price cannot be zero");
    }
    this.basePrice = price;
  }

  scheduleBasePrice(scheduledPrice: ScheduledPrice): void {
    this.scheduledPrices.push(scheduledPrice);
    this.scheduledPrices.sort(
      (a, b) => a.getEffectiveDate().getTime() - b.getEffectiveDate().getTime(),
    );
  }

  setBulkTiers(tiers: BulkTier[]): void {
    this.bulkTiers = [...tiers].sort((a, b) => a.getMinQuantity() - b.getMinQuantity());
  }

  getEffectiveBasePrice(at: Date): Money {
    let effectivePrice = this.basePrice;
    for (const scheduled of this.scheduledPrices) {
      if (scheduled.isEffectiveAt(at)) {
        effectivePrice = scheduled.getPrice();
      }
    }
    return effectivePrice;
  }

  addPromotion(promotion: Promotion): void {
    const existing = this.promotions.find((p) => p.equals(promotion));
    if (existing) {
      throw new Error(`Promotion already exists: ${promotion.getName()}`);
    }
    this.promotions.push(promotion);
    this.promotions.sort((a, b) => b.getPriority() - a.getPriority());
  }

  removePromotion(promotionName: string): void {
    const index = this.promotions.findIndex((p) => p.getName() === promotionName);
    if (index === -1) {
      throw new Error(`Promotion not found: ${promotionName}`);
    }
    this.promotions.splice(index, 1);
  }

  findPromotion(promotionName: string): Promotion | undefined {
    return this.promotions.find((p) => p.getName() === promotionName);
  }

  calculatePrice(
    availability: AvailabilitySignal,
    now: Date = new Date(),
    quantity?: number,
  ): CalculatedPrice {
    const effectiveBase = this.getEffectiveBasePrice(now);
    const activePromotions = this.promotions.filter((p) => p.isActiveAt(now));
    const appliedDiscounts: AppliedDiscount[] = [];
    let currentPrice = effectiveBase;

    const applicableTier = this.findApplicableTier(quantity);
    if (applicableTier && applicableTier.getDiscountPercentage() > 0) {
      const tierDiscount = applicableTier.getDiscountPercentage();
      currentPrice = currentPrice.applyDiscount(tierDiscount);
      appliedDiscounts.push(
        new AppliedDiscount(
          `Bulk discount (${applicableTier.getMinQuantity()}+ units)`,
          tierDiscount,
          tierDiscount,
          "Bulk tier discount applied",
        ),
      );
    }

    for (const promotion of activePromotions) {
      const originalPercentage = promotion.getDiscountPercentage();
      let appliedPercentage = originalPercentage;
      let reason = "Full discount applied";

      if (availability.isOutOfStock) {
        appliedPercentage = 0;
        reason = "No discount: item out of stock";
      } else if (availability.isLow) {
        appliedPercentage = originalPercentage * (1 - LOW_STOCK_DISCOUNT_REDUCTION);
        reason = "Reduced discount: low stock";
      }

      if (appliedPercentage > 0) {
        currentPrice = currentPrice.applyDiscount(appliedPercentage);
      }

      appliedDiscounts.push(
        new AppliedDiscount(promotion.getName(), originalPercentage, appliedPercentage, reason),
      );
    }

    return new CalculatedPrice(this.sku.toString(), effectiveBase, currentPrice, appliedDiscounts);
  }

  private findApplicableTier(quantity?: number): BulkTier | undefined {
    if (quantity === undefined || this.bulkTiers.length === 0) {
      return undefined;
    }
    let applicable: BulkTier | undefined;
    for (const tier of this.bulkTiers) {
      if (tier.appliesTo(quantity)) {
        applicable = tier;
      }
    }
    return applicable;
  }
}
