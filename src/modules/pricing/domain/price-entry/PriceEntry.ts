import type { SKU } from "./Sku.js";
import type { Money } from "./Money.js";
import type { Promotion } from "./Promotion.js";
import type { ScheduledPrice } from "./ScheduledPrice.js";
import type { BulkTier } from "./BulkTier.js";
import { CalculatedPrice, AppliedDiscount } from "./CalculatedPrice.js";
import type { AvailabilitySignal } from "../../../../shared/contract/warehouse/AvailabilitySignal.js";

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

  setBasePrice(price: Money): void {
    if (price.isZero()) {
      throw new Error("Base price cannot be zero");
    }
    this.basePrice = price;
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

  schedulePrice(scheduledPrice: ScheduledPrice): void {
    this.scheduledPrices.push(scheduledPrice);
    this.scheduledPrices.sort(
      (a, b) => b.getEffectiveDate().getTime() - a.getEffectiveDate().getTime(),
    );
  }

  setBulkTiers(tiers: BulkTier[]): void {
    this.bulkTiers = [...tiers];
  }

  getBulkTiers(): readonly BulkTier[] {
    return [...this.bulkTiers];
  }

  getEffectiveBasePrice(now: Date): Money {
    for (const scheduled of this.scheduledPrices) {
      if (scheduled.isEffectiveAt(now)) {
        return scheduled.getPrice();
      }
    }
    return this.basePrice;
  }

  calculatePrice(
    availability: AvailabilitySignal,
    now: Date = new Date(),
    quantity: number = 1,
  ): CalculatedPrice {
    const effectiveBase = this.getEffectiveBasePrice(now);
    const activePromotions = this.promotions.filter((p) => p.isActiveAt(now));
    const appliedDiscounts: AppliedDiscount[] = [];
    let currentPrice = effectiveBase;

    const applicableTier = this.bulkTiers.find((tier) => tier.appliesTo(quantity));
    if (applicableTier && applicableTier.getDiscountPercentage() > 0) {
      currentPrice = currentPrice.applyDiscount(applicableTier.getDiscountPercentage());
      appliedDiscounts.push(
        new AppliedDiscount(
          `Bulk tier (${applicableTier.getMinQuantity()}+)`,
          applicableTier.getDiscountPercentage(),
          applicableTier.getDiscountPercentage(),
          "Bulk discount applied",
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
}
