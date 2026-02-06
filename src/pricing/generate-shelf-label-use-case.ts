import type { PricingRepository } from "./pricing-repository.js";
import type { InventoryRepository } from "../inventory/inventory-repository.js";
import { isPromotionActive } from "./promotion.js";

interface ShelfLabelWithDiscount {
  sku: string;
  finalPriceInCents: number;
  originalBasePriceInCents: number;
  savingsPercentage: number;
  availabilityBadge: string;
}

interface ShelfLabelWithoutDiscount {
  sku: string;
  finalPriceInCents: number;
  savingsPercentage: number;
  availabilityBadge: string;
}

export type ShelfLabel = ShelfLabelWithDiscount | ShelfLabelWithoutDiscount;

export class GenerateShelfLabelUseCase {
  constructor(
    private pricingRepository: PricingRepository,
    private inventoryRepository: InventoryRepository,
  ) {}

  execute(sku: string): ShelfLabel {
    const priceEntry = this.pricingRepository.findBySku(sku);
    if (!priceEntry) {
      throw new Error("Price entry not found");
    }

    const basePriceInCents = priceEntry.getBasePriceInCents();
    const item = this.inventoryRepository.findBySku(sku);
    const availableQuantity = item ? item.getAvailableQuantity() : 0;

    const activePromotions = priceEntry
      .getPromotions()
      .filter((promotion) => isPromotionActive(promotion));

    let totalDiscountPercentage = 0;
    for (const promotion of activePromotions) {
      const appliedPercentage = this.calculateAppliedPercentage(
        promotion.discountPercentage,
        availableQuantity,
      );
      totalDiscountPercentage += appliedPercentage;
    }

    const finalPriceInCents = Math.round(basePriceInCents * (1 - totalDiscountPercentage / 100));
    const availabilityBadge = this.getAvailabilityBadge(availableQuantity);

    if (totalDiscountPercentage > 0) {
      return {
        sku,
        finalPriceInCents,
        originalBasePriceInCents: basePriceInCents,
        savingsPercentage: totalDiscountPercentage,
        availabilityBadge,
      };
    }

    return {
      sku,
      finalPriceInCents,
      savingsPercentage: 0,
      availabilityBadge,
    };
  }

  private calculateAppliedPercentage(
    discountPercentage: number,
    availableQuantity: number,
  ): number {
    if (availableQuantity === 0) {
      return 0;
    }
    if (availableQuantity <= 5) {
      return discountPercentage / 2;
    }
    return discountPercentage;
  }

  private getAvailabilityBadge(availableQuantity: number): string {
    if (availableQuantity === 0) {
      return "Out of Stock";
    }
    if (availableQuantity <= 5) {
      return "Low Stock";
    }
    return "In Stock";
  }
}
