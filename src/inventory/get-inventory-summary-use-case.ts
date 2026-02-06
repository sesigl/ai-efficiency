import type { InventoryRepository } from "./inventory-repository.js";

export interface InventorySummary {
  totalProducts: number;
  totalUnitsInStock: number;
  itemsNeedingReorder: number;
  outOfStockItems: number;
}

export class GetInventorySummaryUseCase {
  constructor(private inventoryRepository: InventoryRepository) {}

  execute(): InventorySummary {
    const items = this.inventoryRepository.findAll();

    let totalUnitsInStock = 0;
    let itemsNeedingReorder = 0;
    let outOfStockItems = 0;

    for (const item of items) {
      totalUnitsInStock += item.getQuantity();

      if (item.getAvailableQuantity() === 0) {
        outOfStockItems++;
      }

      if (item.needsReorder()) {
        itemsNeedingReorder++;
      }
    }

    return {
      totalProducts: items.length,
      totalUnitsInStock,
      itemsNeedingReorder,
      outOfStockItems,
    };
  }
}
