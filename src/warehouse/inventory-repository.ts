import { Inventory } from "./inventory.js";

export class InventoryRepository {
  private inventories: Map<string, Inventory> = new Map();

  findBySku(sku: string): Inventory | undefined {
    return this.inventories.get(sku);
  }

  save(inventory: Inventory): void {
    this.inventories.set(inventory.sku, inventory);
  }
}
