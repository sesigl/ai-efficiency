import type { SKU } from "./SKU.js";
import type { Money } from "./Money.js";
import type { Promotion } from "./Promotion.js";
import { CalculatedPrice, AppliedDiscount } from "./CalculatedPrice.js";
import type { AvailabilitySignal } from "../../../shared/contract/warehouse/AvailabilitySignal.js";

const LOW_STOCK_DISCOUNT_REDUCTION = 0.5;

export class PriceEntry {
  private constructor(
    private readonly sku: SKU,
    private basePrice: Money,
    private promotions: Promotion[],
  ) {}

  static create(sku: SKU, basePrice: Money): PriceEntry {
    if (basePrice.isZero()) {
      throw new Error("Base price cannot be zero");
    }
    return new PriceEntry(sku, basePrice, []);
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

  calculatePrice(availability: AvailabilitySignal, now: Date = new Date()): CalculatedPrice {
    const activePromotions = this.promotions.filter((p) => p.isActiveAt(now));
    const appliedDiscounts: AppliedDiscount[] = [];
    let currentPrice = this.basePrice;

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

    return new CalculatedPrice(this.sku.toString(), this.basePrice, currentPrice, appliedDiscounts);
  }
}
