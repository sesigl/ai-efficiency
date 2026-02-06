import type { PriceEntryRepository } from "../../domain/price-entry/PriceEntryRepository.js";
import { Promotion, type PromotionType } from "../../domain/price-entry/Promotion.js";
import { SKU } from "../../domain/price-entry/Sku.js";

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

export interface ClonePromotionCommand {
  sourceSku: string;
  promotionName: string;
  targetSkus: string[];
}

export interface ClonePromotionResult {
  clonedCount: number;
  skippedSkus: string[];
}

export interface ListActivePromotionsQuery {
  type?: PromotionType;
}

export interface ActivePromotionDTO {
  sku: string;
  name: string;
  type: PromotionType;
  discountPercentage: number;
  validFrom: Date;
  validUntil: Date;
  priority: number;
}

export class PromotionUseCases {
  constructor(private readonly repository: PriceEntryRepository) {}

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

  listActivePromotions(query: ListActivePromotionsQuery): ActivePromotionDTO[] {
    const now = new Date();
    const allEntries = this.repository.findAll();
    const result: ActivePromotionDTO[] = [];

    for (const entry of allEntries) {
      for (const promotion of entry.getPromotions()) {
        if (!promotion.isActiveAt(now)) {
          continue;
        }
        if (query.type && promotion.getType() !== query.type) {
          continue;
        }
        result.push({
          sku: entry.getSku().toString(),
          name: promotion.getName(),
          type: promotion.getType(),
          discountPercentage: promotion.getDiscountPercentage(),
          validFrom: promotion.getValidFrom(),
          validUntil: promotion.getValidUntil(),
          priority: promotion.getPriority(),
        });
      }
    }

    return result;
  }

  clonePromotion(command: ClonePromotionCommand): ClonePromotionResult {
    const sourceSku = SKU.create(command.sourceSku);
    const sourceEntry = this.repository.findBySku(sourceSku);

    if (!sourceEntry) {
      throw new Error(`Price entry not found: ${command.sourceSku}`);
    }

    const sourcePromotion = sourceEntry.findPromotion(command.promotionName);
    if (!sourcePromotion) {
      throw new Error(`Promotion not found: ${command.promotionName}`);
    }

    let clonedCount = 0;
    const skippedSkus: string[] = [];

    for (const targetSkuStr of command.targetSkus) {
      const targetSku = SKU.create(targetSkuStr);
      const targetEntry = this.repository.findBySku(targetSku);

      if (!targetEntry) {
        skippedSkus.push(targetSkuStr);
        continue;
      }

      const clonedPromotion = Promotion.create(
        sourcePromotion.getName(),
        sourcePromotion.getType(),
        sourcePromotion.getDiscountPercentage(),
        sourcePromotion.getValidFrom(),
        sourcePromotion.getValidUntil(),
        sourcePromotion.getPriority(),
      );

      targetEntry.addPromotion(clonedPromotion);
      this.repository.save(targetEntry);
      clonedCount++;
    }

    return { clonedCount, skippedSkus };
  }
}
