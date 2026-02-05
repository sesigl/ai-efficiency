import type { InventoryRepository } from "./inventory-repository.js";

export class RemoveStock {
  constructor(private inventoryRepository: InventoryRepository) {}

  execute(sku: string, quantity: number): void {
    const item = this.inventoryRepository.findBySku(sku);
    if (!item) {
      throw new Error("Inventory item not found");
    }
    item.removeStock(quantity);
    this.inventoryRepository.save(item);
  }
}
