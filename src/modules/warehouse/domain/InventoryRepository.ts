import type { InventoryItem } from "./InventoryItem.js";
import type { SKU } from "./SKU.js";

export interface InventoryRepository {
  findBySku(sku: SKU): InventoryItem | undefined;
  save(item: InventoryItem): void;
  findAll(): InventoryItem[];
}
