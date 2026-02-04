import type { InventoryRepository } from "../domain/InventoryRepository.js";
import type { InventoryItem } from "../domain/InventoryItem.js";
import type { SKU } from "../domain/SKU.js";

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
