import type { PriceRepository } from "./price-repository.js";

export class RemovePromotion {
  constructor(private priceRepository: PriceRepository) {}

  execute(sku: string, promotionName: string): void {
    const entry = this.priceRepository.findBySku(sku);
    if (!entry) {
      throw new Error("Price entry not found");
    }
    entry.removePromotion(promotionName);
    this.priceRepository.save(entry);
  }
}
