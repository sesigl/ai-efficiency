import type { InventoryItemRepository } from "../../../domain/inventory-item/InventoryItemRepository.js";
import type { InventoryItem } from "../../../domain/inventory-item/InventoryItem.js";
import type { SKU } from "../../../domain/inventory-item/Sku.js";

export class InMemoryInventoryItemRepository implements InventoryItemRepository {
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
