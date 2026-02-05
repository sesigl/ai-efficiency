import type { PriceRepository } from "./price-repository.js";
import type { Promotion } from "./price-entry.js";

export class AddPromotion {
  constructor(private priceRepository: PriceRepository) {}

  execute(sku: string, promotion: Promotion): void {
    const entry = this.priceRepository.findBySku(sku);
    if (!entry) {
      throw new Error("Price entry not found");
    }
    entry.addPromotion(promotion);
    this.priceRepository.save(entry);
  }
}
