import { InventoryItem } from "./inventory-item.js";

export interface InventoryRepository {
  findBySku(sku: string): InventoryItem | undefined;
  save(item: InventoryItem): void;
  getOrCreate(sku: string, initialQuantity: number): InventoryItem;
  findAll(): InventoryItem[];
}

export class InMemoryInventoryRepository implements InventoryRepository {
  private items = new Map<string, InventoryItem>();

  findBySku(sku: string): InventoryItem | undefined {
    return this.items.get(sku);
  }

  save(item: InventoryItem): void {
    this.items.set(item.sku, item);
  }

  getOrCreate(sku: string, initialQuantity: number): InventoryItem {
    const existing = this.findBySku(sku);
    if (existing) {
      return existing;
    }
    const newItem = new InventoryItem(sku, initialQuantity);
    this.save(newItem);
    return newItem;
  }

  findAll(): InventoryItem[] {
    return [...this.items.values()];
  }
}
