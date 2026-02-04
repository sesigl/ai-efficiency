import { PriceEntryUseCases } from "../application/price-entry/PriceEntryUseCases.js";
import { PromotionUseCases } from "../application/promotions/PromotionUseCases.js";
import type { AvailabilityProvider } from "../domain/AvailabilityProvider.js";
import type { PriceEntryRepository } from "../domain/PriceEntryRepository.js";
import { InMemoryPriceEntryRepository } from "./InMemoryPriceEntryRepository.js";

export interface PricingUseCases {
  repository: PriceEntryRepository;
  priceEntries: PriceEntryUseCases;
  promotions: PromotionUseCases;
}

export function createPricingUseCases(
  availabilityProvider: AvailabilityProvider,
  repository?: PriceEntryRepository,
): PricingUseCases {
  const repo = repository ?? new InMemoryPriceEntryRepository();

  return {
    repository: repo,
    priceEntries: new PriceEntryUseCases(repo, availabilityProvider),
    promotions: new PromotionUseCases(repo),
  };
}
