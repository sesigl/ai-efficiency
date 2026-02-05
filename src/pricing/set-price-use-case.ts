import { PriceEntry } from "./price-entry.js";
import type { PricingRepository } from "./pricing-repository.js";

export interface SetPriceRequest {
  sku: string;
  priceInCents: number;
  currency?: string;
}

export class SetPriceUseCase {
  constructor(private pricingRepository: PricingRepository) {}

  execute(request: SetPriceRequest): void {
    const existingEntry = this.pricingRepository.findBySku(request.sku);

    if (existingEntry) {
      existingEntry.updatePrice(request.priceInCents, request.currency);
      return;
    }

    const newEntry = new PriceEntry(request.sku, request.priceInCents, request.currency || "USD");
    this.pricingRepository.save(newEntry);
  }
}
