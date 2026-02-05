import { InventoryItem } from "./inventory-item.js";

export class InventoryRepository {
  private items: Map<string, InventoryItem>;

  constructor() {
    this.items = new Map();
  }

  findBySku(sku: string): InventoryItem | undefined {
    return this.items.get(sku);
  }

  save(item: InventoryItem): void {
    this.items.set(item.sku, item);
  }

  getOrCreate(sku: string): InventoryItem {
    let item = this.items.get(sku);
    if (!item) {
      item = new InventoryItem(sku);
      this.items.set(sku, item);
    }
    return item;
  }
}
