import type { PriceRepository } from "../domain/PriceRepository.js";
import { SKU } from "../domain/SKU.js";

export class RemovePromotionCommand {
  constructor(
    public readonly sku: string,
    public readonly promotionName: string,
  ) {}
}

export class RemovePromotion {
  constructor(private readonly repository: PriceRepository) {}

  execute(command: RemovePromotionCommand): void {
    const sku = SKU.create(command.sku);
    const entry = this.repository.findBySku(sku);

    if (!entry) {
      throw new Error(`Price entry not found: ${command.sku}`);
    }

    entry.removePromotion(command.promotionName);
    this.repository.save(entry);
  }
}
