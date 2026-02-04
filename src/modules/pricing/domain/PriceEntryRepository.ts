import type { PriceEntry } from "./PriceEntry.js";
import type { SKU } from "./Sku.js";

export interface PriceEntryRepository {
  findBySku(sku: SKU): PriceEntry | undefined;
  save(entry: PriceEntry): void;
  findAll(): PriceEntry[];
}
