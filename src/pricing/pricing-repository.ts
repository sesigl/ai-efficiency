import type { PriceEntry } from "./price-entry.js";

export interface PricingRepository {
  findBySku(sku: string): PriceEntry | undefined;
  save(entry: PriceEntry): void;
  findAll(): PriceEntry[];
}

export class InMemoryPricingRepository implements PricingRepository {
  private entries = new Map<string, PriceEntry>();

  findBySku(sku: string): PriceEntry | undefined {
    return this.entries.get(sku);
  }

  save(entry: PriceEntry): void {
    this.entries.set(entry.sku, entry);
  }

  findAll(): PriceEntry[] {
    return [...this.entries.values()];
  }
}
