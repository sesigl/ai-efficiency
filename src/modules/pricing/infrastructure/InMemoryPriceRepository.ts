import type { PriceRepository } from "../domain/PriceRepository.js";
import type { PriceEntry } from "../domain/PriceEntry.js";
import type { SKU } from "../domain/SKU.js";

export class InMemoryPriceRepository implements PriceRepository {
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
