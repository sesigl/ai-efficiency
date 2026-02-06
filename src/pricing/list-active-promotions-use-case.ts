import type { Promotion } from "./promotion.js";
import { isPromotionActive } from "./promotion.js";
import type { PricingRepository } from "./pricing-repository.js";

export interface ActivePromotion extends Promotion {
  sku: string;
}

export class ListActivePromotionsUseCase {
  constructor(private pricingRepository: PricingRepository) {}

  execute(type?: string): ActivePromotion[] {
    const allEntries = this.pricingRepository.findAll();
    const activePromotions: ActivePromotion[] = [];

    for (const entry of allEntries) {
      for (const promotion of entry.getPromotions()) {
        if (!isPromotionActive(promotion)) {
          continue;
        }
        if (type !== undefined && promotion.type !== type) {
          continue;
        }
        activePromotions.push({ ...promotion, sku: entry.sku });
      }
    }

    return activePromotions;
  }
}
