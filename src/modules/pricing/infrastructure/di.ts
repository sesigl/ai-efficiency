import type { PriceRepository, AvailabilityProvider } from "../domain/index.js";
import { InMemoryPriceRepository } from "./InMemoryPriceRepository.js";
import {
  WarehouseAvailabilityAdapter,
  type AvailabilityFetcher,
} from "./WarehouseAvailabilityAdapter.js";

export interface PricingInfrastructure {
  repository: PriceRepository;
  createAvailabilityProvider: (fetcher: AvailabilityFetcher) => AvailabilityProvider;
}

export function createPricingInfrastructure(): PricingInfrastructure {
  return {
    repository: new InMemoryPriceRepository(),
    createAvailabilityProvider: (fetcher: AvailabilityFetcher) =>
      new WarehouseAvailabilityAdapter(fetcher),
  };
}
