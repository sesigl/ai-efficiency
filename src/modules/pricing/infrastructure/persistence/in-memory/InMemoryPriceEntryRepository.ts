import type { PriceEntryRepository } from "../../../domain/price-entry/PriceEntryRepository.js";
import type { PriceEntry } from "../../../domain/price-entry/PriceEntry.js";
import type { SKU } from "../../../domain/price-entry/Sku.js";

export class InMemoryPriceEntryRepository implements PriceEntryRepository {
  private entries: Map<string, PriceEntry> = new Map();

  findBySku(sku: SKU): PriceEntry | undefined {
    return this.entries.get(sku.toString());
  }

  save(entry: PriceEntry): void {
    this.entries.set(entry.getSku().toString(), entry);
  }

  findAll(): PriceEntry[] {
    return Array.from(this.entries.values());
  }

  clear(): void {
    this.entries.clear();
  }
}
