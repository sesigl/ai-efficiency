import type { InventoryRepository } from "./inventory-repository.js";

export class AdjustStockUseCase {
  constructor(private inventoryRepository: InventoryRepository) {}

  execute(sku: string, quantityDelta: number): void {
    if (quantityDelta === 0) {
      throw new Error("Cannot add zero quantity");
    }

    if (quantityDelta > 0) {
      const item = this.inventoryRepository.getOrCreate(sku, 0);
      item.addStock(quantityDelta);
      return;
    }

    const item = this.inventoryRepository.findBySku(sku);
    if (!item) {
      throw new Error("Inventory item not found");
    }

    item.removeStock(Math.abs(quantityDelta));
  }
}
