import type { InventoryItem } from "./InventoryItem.js";
import type { SKU } from "./SKU.js";

export interface InventoryItemRepository {
  findBySku(sku: SKU): InventoryItem | undefined;
  save(item: InventoryItem): void;
  findAll(): InventoryItem[];
}
