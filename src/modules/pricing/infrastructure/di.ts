import { PriceEntryUseCases } from "../application/price-entry/PriceEntryUseCases.js";
import { PromotionUseCases } from "../application/promotions/PromotionUseCases.js";
import type { AvailabilityProvider } from "../domain/AvailabilityProvider.js";
import type { PriceRepository } from "../domain/PriceRepository.js";
import { InMemoryPriceRepository } from "./InMemoryPriceRepository.js";

export interface PricingUseCases {
  repository: PriceRepository;
  priceEntries: PriceEntryUseCases;
  promotions: PromotionUseCases;
}

export function createPricingUseCases(
  availabilityProvider: AvailabilityProvider,
  repository?: PriceRepository,
): PricingUseCases {
  const repo = repository ?? new InMemoryPriceRepository();

  return {
    repository: repo,
    priceEntries: new PriceEntryUseCases(repo, availabilityProvider),
    promotions: new PromotionUseCases(repo),
  };
}
