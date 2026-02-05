import type { PricingRepository } from "./pricing-repository.js";
import type { Promotion } from "./promotion.js";

export interface AddPromotionRequest {
  sku: string;
  name: string;
  type: string;
  discountPercentage: number;
  validFrom: string;
  validUntil: string;
  priority?: number;
}

export class AddPromotionUseCase {
  constructor(private pricingRepository: PricingRepository) {}

  execute(request: AddPromotionRequest): void {
    const priceEntry = this.pricingRepository.findBySku(request.sku);

    if (!priceEntry) {
      throw new Error("Price entry not found");
    }

    const promotion: Promotion = {
      name: request.name,
      type: request.type,
      discountPercentage: request.discountPercentage,
      validFrom: request.validFrom,
      validUntil: request.validUntil,
      priority: request.priority ?? 0,
    };

    priceEntry.addPromotion(promotion);
  }
}
