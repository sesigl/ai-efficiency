import type { PricingRepository } from "./pricing-repository.js";

export interface ClonePromotionResult {
  cloned: number;
  skipped: string[];
}

export class ClonePromotionUseCase {
  constructor(private pricingRepository: PricingRepository) {}

  execute(promotionName: string, sourceSku: string, targetSkus: string[]): ClonePromotionResult {
    const sourceEntry = this.pricingRepository.findBySku(sourceSku);
    if (!sourceEntry) {
      throw new Error("Source price entry not found");
    }

    const promotion = sourceEntry.getPromotions().find((p) => p.name === promotionName);
    if (!promotion) {
      throw new Error("Promotion not found");
    }

    let cloned = 0;
    const skipped: string[] = [];

    for (const targetSku of targetSkus) {
      const targetEntry = this.pricingRepository.findBySku(targetSku);
      if (!targetEntry) {
        skipped.push(targetSku);
        continue;
      }

      targetEntry.addPromotion({ ...promotion });
      cloned++;
    }

    return { cloned, skipped };
  }
}
