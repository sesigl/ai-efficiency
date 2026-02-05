import type { PriceRepository } from "./price-repository.js";

export class SetBasePrice {
  constructor(private priceRepository: PriceRepository) {}

  execute(sku: string, priceInCents: number, currency?: string): void {
    if (priceInCents <= 0) {
      throw new Error("Base price cannot be zero");
    }
    const entry = this.priceRepository.getOrCreate(sku, priceInCents, currency);
    entry.updateBasePrice(priceInCents);
    this.priceRepository.save(entry);
  }
}
