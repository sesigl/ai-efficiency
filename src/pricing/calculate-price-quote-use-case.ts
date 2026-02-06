import type { PricingRepository } from "./pricing-repository.js";
import type { InventoryRepository } from "../inventory/inventory-repository.js";
import { isPromotionActive } from "./promotion.js";
import type { Promotion } from "./promotion.js";

export interface AppliedDiscount {
  name: string;
  type: string;
  originalPercentage: number;
  appliedPercentage: number;
  reason: string;
}

export interface PriceQuote {
  sku: string;
  basePriceInCents: number;
  finalPriceInCents: number;
  currency: string;
  totalDiscountPercentage: number;
  appliedDiscounts: AppliedDiscount[];
}

export class CalculatePriceQuoteUseCase {
  constructor(
    private pricingRepository: PricingRepository,
    private inventoryRepository: InventoryRepository,
  ) {}

  execute(sku: string, atDate?: Date, quantity?: number): PriceQuote {
    const priceEntry = this.pricingRepository.findBySku(sku);

    if (!priceEntry) {
      throw new Error("Price entry not found");
    }

    const basePriceInCents = priceEntry.getEffectiveBasePriceInCents(atDate);
    const currency = priceEntry.getCurrency();

    const item = this.inventoryRepository.findBySku(sku);
    const availableQuantity = item ? item.getAvailableQuantity() : 0;

    const activePromotions = priceEntry
      .getPromotions()
      .filter((promotion) => isPromotionActive(promotion, atDate))
      .sort((a, b) => b.priority - a.priority);

    const appliedDiscounts: AppliedDiscount[] = [];
    let totalDiscountPercentage = 0;

    for (const promotion of activePromotions) {
      const { appliedPercentage, reason } = this.calculateAppliedDiscount(
        promotion,
        availableQuantity,
      );

      appliedDiscounts.push({
        name: promotion.name,
        type: promotion.type,
        originalPercentage: promotion.discountPercentage,
        appliedPercentage,
        reason,
      });

      totalDiscountPercentage += appliedPercentage;
    }

    if (quantity !== undefined) {
      const bulkDiscountPercentage = priceEntry.getBulkDiscountPercentage(quantity);
      totalDiscountPercentage += bulkDiscountPercentage;
    }

    const finalPriceInCents = Math.round(basePriceInCents * (1 - totalDiscountPercentage / 100));

    return {
      sku,
      basePriceInCents,
      finalPriceInCents,
      currency,
      totalDiscountPercentage,
      appliedDiscounts,
    };
  }

  private calculateAppliedDiscount(
    promotion: Promotion,
    availableQuantity: number,
  ): { appliedPercentage: number; reason: string } {
    if (availableQuantity === 0) {
      return {
        appliedPercentage: 0,
        reason: "No discount: item out of stock",
      };
    }

    if (availableQuantity <= 5) {
      return {
        appliedPercentage: promotion.discountPercentage / 2,
        reason: "Reduced discount: low stock",
      };
    }

    return {
      appliedPercentage: promotion.discountPercentage,
      reason: "Full discount applied",
    };
  }
}
