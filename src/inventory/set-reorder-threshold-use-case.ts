import type { InventoryRepository } from "./inventory-repository.js";

export class SetReorderThresholdUseCase {
  constructor(private inventoryRepository: InventoryRepository) {}

  execute(sku: string, threshold: number): void {
    const item = this.inventoryRepository.getOrCreate(sku, 0);
    item.setReorderThreshold(threshold);
  }
}
