import type { PriceRepository } from "../../domain/PriceRepository.js";
import { Promotion, type PromotionType } from "../../domain/Promotion.js";
import { SKU } from "../../domain/SKU.js";

export interface AddPromotionCommand {
  sku: string;
  name: string;
  type: PromotionType;
  discountPercentage: number;
  validFrom: Date;
  validUntil: Date;
  priority?: number;
}

export interface RemovePromotionCommand {
  sku: string;
  promotionName: string;
}

export class PromotionUseCases {
  constructor(private readonly repository: PriceRepository) {}

  addPromotion(command: AddPromotionCommand): void {
    const sku = SKU.create(command.sku);
    const entry = this.repository.findBySku(sku);

    if (!entry) {
      throw new Error(`Price entry not found: ${command.sku}`);
    }

    const promotion = Promotion.create(
      command.name,
      command.type,
      command.discountPercentage,
      command.validFrom,
      command.validUntil,
      command.priority ?? 0,
    );

    entry.addPromotion(promotion);
    this.repository.save(entry);
  }

  removePromotion(command: RemovePromotionCommand): void {
    const sku = SKU.create(command.sku);
    const entry = this.repository.findBySku(sku);

    if (!entry) {
      throw new Error(`Price entry not found: ${command.sku}`);
    }

    entry.removePromotion(command.promotionName);
    this.repository.save(entry);
  }
}
