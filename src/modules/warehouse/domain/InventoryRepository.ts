import { InventoryItem } from './InventoryItem.js';
import { SKU } from './SKU.js';

export interface InventoryRepository {
  findBySku(sku: SKU): InventoryItem | undefined;
  save(item: InventoryItem): void;
  findAll(): InventoryItem[];
}
