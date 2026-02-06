import type { PricingRepository } from "./pricing-repository.js";

export class ScheduleFuturePriceUseCase {
  constructor(private pricingRepository: PricingRepository) {}

  execute(sku: string, priceInCents: number, effectiveDate: string): void {
    const priceEntry = this.pricingRepository.findBySku(sku);
    if (!priceEntry) {
      throw new Error("Price entry not found");
    }

    priceEntry.addScheduledPriceChange(priceInCents, effectiveDate);
  }
}
