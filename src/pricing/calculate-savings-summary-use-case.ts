import type { PricingRepository } from "./pricing-repository.js";
import type { InventoryRepository } from "../inventory/inventory-repository.js";
import { isPromotionActive } from "./promotion.js";
import type { Promotion } from "./promotion.js";

export interface DiscountDetail {
  name: string;
  type: string;
  discountPercentage: number;
  amountSavedInCents: number;
}

export interface SavingsSummary {
  sku: string;
  basePriceInCents: number;
  finalPriceInCents: number;
  totalSavingsInCents: number;
  totalSavingsPercentage: number;
  discounts: DiscountDetail[];
}

export class CalculateSavingsSummaryUseCase {
  constructor(
    private pricingRepository: PricingRepository,
    private inventoryRepository: InventoryRepository,
  ) {}

  execute(sku: string): SavingsSummary {
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

    const discounts: DiscountDetail[] = [];
    let totalDiscountPercentage = 0;

    for (const promotion of activePromotions) {
      const appliedPercentage = this.calculateAppliedPercentage(promotion, availableQuantity);
      const amountSavedInCents = Math.round(basePriceInCents * (appliedPercentage / 100));

      discounts.push({
        name: promotion.name,
        type: promotion.type,
        discountPercentage: appliedPercentage,
        amountSavedInCents,
      });

      totalDiscountPercentage += appliedPercentage;
    }

    const finalPriceInCents = Math.round(basePriceInCents * (1 - totalDiscountPercentage / 100));
    const totalSavingsInCents = basePriceInCents - finalPriceInCents;

    return {
      sku,
      basePriceInCents,
      finalPriceInCents,
      totalSavingsInCents,
      totalSavingsPercentage: totalDiscountPercentage,
      discounts,
    };
  }

  private calculateAppliedPercentage(promotion: Promotion, availableQuantity: number): number {
    if (availableQuantity === 0) {
      return 0;
    }
    if (availableQuantity <= 5) {
      return promotion.discountPercentage / 2;
    }
    return promotion.discountPercentage;
  }
}
