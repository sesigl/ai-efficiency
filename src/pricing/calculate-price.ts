import type { PriceRepository } from "./price-repository.js";
import type { CheckAvailability } from "../warehouse/check-availability.js";
import type { Promotion } from "./price-entry.js";

export interface AppliedDiscount {
  name: string;
  originalPercentage: number;
  appliedPercentage: number;
  reason: string;
}

export interface PriceCalculation {
  sku: string;
  basePriceInCents: number;
  finalPriceInCents: number;
  currency: string;
  totalDiscountPercentage: number;
  appliedDiscounts: AppliedDiscount[];
}

export class CalculatePrice {
  constructor(
    private priceRepository: PriceRepository,
    private checkAvailability: CheckAvailability,
  ) {}

  execute(sku: string, at?: Date): PriceCalculation {
    const entry = this.priceRepository.findBySku(sku);
    if (!entry) {
      throw new Error("Price entry not found");
    }

    const availability = this.checkAvailability.execute(sku);
    const currentDate = at || new Date();
    const activePromotions = this.filterActivePromotions(entry.promotions, currentDate);

    const appliedDiscounts: AppliedDiscount[] = [];
    let totalDiscountPercentage = 0;

    for (const promotion of activePromotions) {
      const { appliedPercentage, reason } = this.calculateAdjustedDiscount(
        promotion.discountPercentage,
        availability.level,
      );

      appliedDiscounts.push({
        name: promotion.name,
        originalPercentage: promotion.discountPercentage,
        appliedPercentage,
        reason,
      });

      totalDiscountPercentage += appliedPercentage;
    }

    const finalPriceInCents = Math.round(
      entry.basePriceInCents * (1 - totalDiscountPercentage / 100),
    );

    return {
      sku: entry.sku,
      basePriceInCents: entry.basePriceInCents,
      finalPriceInCents,
      currency: entry.currency,
      totalDiscountPercentage,
      appliedDiscounts,
    };
  }

  private filterActivePromotions(promotions: Promotion[], currentDate: Date): Promotion[] {
    return promotions.filter((promotion) => {
      const validFrom = new Date(promotion.validFrom);
      const validUntil = new Date(promotion.validUntil);
      return currentDate >= validFrom && currentDate <= validUntil;
    });
  }

  private calculateAdjustedDiscount(
    originalPercentage: number,
    availabilityLevel: "HIGH" | "LOW" | "OUT_OF_STOCK",
  ): { appliedPercentage: number; reason: string } {
    if (availabilityLevel === "OUT_OF_STOCK") {
      return { appliedPercentage: 0, reason: "No discount: item out of stock" };
    }
    if (availabilityLevel === "LOW") {
      return {
        appliedPercentage: originalPercentage / 2,
        reason: "Reduced discount: low stock",
      };
    }
    return { appliedPercentage: originalPercentage, reason: "Full discount applied" };
  }
}
