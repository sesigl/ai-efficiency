import type { InventoryRepository } from "./inventory-repository.js";

export class AddStock {
  constructor(private inventoryRepository: InventoryRepository) {}

  execute(sku: string, quantity: number): void {
    if (quantity <= 0) {
      throw new Error("Cannot add zero quantity");
    }
    const item = this.inventoryRepository.getOrCreate(sku);
    item.addStock(quantity);
    this.inventoryRepository.save(item);
  }
}
