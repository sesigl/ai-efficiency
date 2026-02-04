import { PriceEntryUseCases } from "../application/price-entry/PriceEntryUseCases.js";
import { PromotionUseCases } from "../application/promotions/PromotionUseCases.js";
import type { AvailabilityProvider } from "../domain/price-entry/AvailabilityProvider.js";
import type { PriceEntryRepository } from "../domain/price-entry/PriceEntryRepository.js";
import { InMemoryPriceEntryRepository } from "./persistence/in-memory/InMemoryPriceEntryRepository.js";

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
