import type { PriceRepository } from "./price-repository.js";
import type { Promotion } from "./price-entry.js";

export interface PriceEntryDetails {
  sku: string;
  basePriceInCents: number;
  currency: string;
  promotions: Promotion[];
}

export class GetPriceEntry {
  constructor(private priceRepository: PriceRepository) {}

  execute(sku: string): PriceEntryDetails {
    const entry = this.priceRepository.findBySku(sku);
    if (!entry) {
      throw new Error("Price entry not found");
    }
    return {
      sku: entry.sku,
      basePriceInCents: entry.basePriceInCents,
      currency: entry.currency,
      promotions: entry.promotions,
    };
  }
}
