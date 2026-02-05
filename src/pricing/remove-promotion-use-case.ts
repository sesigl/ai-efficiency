import type { PricingRepository } from "./pricing-repository.js";

export class RemovePromotionUseCase {
  constructor(private pricingRepository: PricingRepository) {}

  execute(sku: string, promotionName: string): void {
    const priceEntry = this.pricingRepository.findBySku(sku);

    if (!priceEntry) {
      return;
    }

    priceEntry.removePromotion(promotionName);
  }
}
