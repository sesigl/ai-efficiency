import type { PricingRepository } from "./pricing-repository.js";
import type { Promotion } from "./promotion.js";

export interface PriceDetails {
  sku: string;
  basePriceInCents: number;
  currency: string;
  promotions: Promotion[];
}

export class GetPriceUseCase {
  constructor(private pricingRepository: PricingRepository) {}

  execute(sku: string): PriceDetails {
    const priceEntry = this.pricingRepository.findBySku(sku);

    if (!priceEntry) {
      throw new Error("Price entry not found");
    }

    return {
      sku: priceEntry.sku,
      basePriceInCents: priceEntry.getBasePriceInCents(),
      currency: priceEntry.getCurrency(),
      promotions: priceEntry.getPromotions(),
    };
  }
}
