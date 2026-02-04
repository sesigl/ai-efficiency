import { PriceRepository, PriceEntry, SKU } from '../domain/index.js';

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
