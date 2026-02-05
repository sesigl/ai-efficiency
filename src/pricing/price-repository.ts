import { PriceEntry } from "./price-entry.js";

export class PriceRepository {
  private entries: Map<string, PriceEntry>;

  constructor() {
    this.entries = new Map();
  }

  findBySku(sku: string): PriceEntry | undefined {
    return this.entries.get(sku);
  }

  save(entry: PriceEntry): void {
    this.entries.set(entry.sku, entry);
  }

  getOrCreate(sku: string, basePriceInCents: number, currency?: string): PriceEntry {
    let entry = this.entries.get(sku);
    if (!entry) {
      entry = new PriceEntry(sku, basePriceInCents, currency);
      this.entries.set(sku, entry);
    }
    return entry;
  }
}
