import type { InventoryRepository } from "./inventory-repository.js";

export interface ReorderNeededItem {
  sku: string;
  availableQuantity: number;
  reorderThreshold: number;
}

export class ListReorderNeededUseCase {
  constructor(private inventoryRepository: InventoryRepository) {}

  execute(): ReorderNeededItem[] {
    return this.inventoryRepository
      .findAll()
      .filter((item) => item.needsReorder())
      .map((item) => ({
        sku: item.sku,
        availableQuantity: item.getAvailableQuantity(),
        reorderThreshold: item.getReorderThreshold()!,
      }));
  }
}
