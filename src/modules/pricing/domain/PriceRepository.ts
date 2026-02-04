import type { PriceEntry } from "./PriceEntry.js";
import type { SKU } from "./SKU.js";

export interface PriceRepository {
  findBySku(sku: SKU): PriceEntry | undefined;
  save(entry: PriceEntry): void;
  findAll(): PriceEntry[];
}
