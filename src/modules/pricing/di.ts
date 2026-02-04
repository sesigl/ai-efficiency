import { PriceEntryUseCases } from "./application/price-entry/PriceEntryUseCases.js";
import { PromotionUseCases } from "./application/promotions/PromotionUseCases.js";
import type { AvailabilityProvider } from "./domain/AvailabilityProvider.js";
import type { PriceRepository } from "./domain/PriceRepository.js";
import { createPricingInfrastructure } from "./infrastructure/di.js";
import type { AvailabilityFetcher } from "./infrastructure/WarehouseAvailabilityAdapter.js";

export interface PricingUseCases {
  repository: PriceRepository;
  priceEntries: PriceEntryUseCases;
  promotions: PromotionUseCases;
}

export function createPricingUseCases(
  availabilityFetcher: AvailabilityFetcher,
  repository?: PriceRepository,
): PricingUseCases {
  const infra = createPricingInfrastructure();
  const repo = repository ?? infra.repository;
  const availabilityProvider: AvailabilityProvider =
    infra.availabilityProviderFactory.create(availabilityFetcher);

  return {
    repository: repo,
    priceEntries: new PriceEntryUseCases(repo, availabilityProvider),
    promotions: new PromotionUseCases(repo),
  };
}
