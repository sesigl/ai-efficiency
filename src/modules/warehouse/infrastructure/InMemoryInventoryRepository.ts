import type { InventoryRepository, InventoryItem, SKU } from "../domain/index.js";

export class InMemoryInventoryRepository implements InventoryRepository {
  private items: Map<string, InventoryItem> = new Map();

  findBySku(sku: SKU): InventoryItem | undefined {
    return this.items.get(sku.toString());
  }

  save(item: InventoryItem): void {
    this.items.set(item.getSku().toString(), item);
  }

  findAll(): InventoryItem[] {
    return Array.from(this.items.values());
  }

  clear(): void {
    this.items.clear();
  }
}
