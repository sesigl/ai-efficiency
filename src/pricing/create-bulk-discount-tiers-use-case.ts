import type { BulkDiscountTier } from "./price-entry.js";
import type { PricingRepository } from "./pricing-repository.js";

export class CreateBulkDiscountTiersUseCase {
  constructor(private pricingRepository: PricingRepository) {}

  execute(sku: string, tiers: BulkDiscountTier[]): void {
    const priceEntry = this.pricingRepository.findBySku(sku);
    if (!priceEntry) {
      throw new Error("Price entry not found");
    }

    priceEntry.setBulkDiscountTiers(tiers);
  }
}
