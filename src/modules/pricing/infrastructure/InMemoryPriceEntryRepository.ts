import type { PriceEntryRepository } from "../domain/PriceEntryRepository.js";
import type { PriceEntry } from "../domain/PriceEntry.js";
import type { SKU } from "../domain/SKU.js";

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
