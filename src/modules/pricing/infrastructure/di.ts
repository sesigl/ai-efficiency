import type { PriceRepository } from "../domain/PriceRepository.js";
import type { AvailabilityProvider } from "../domain/AvailabilityProvider.js";
import { InMemoryPriceRepository } from "./InMemoryPriceRepository.js";
import {
  WarehouseAvailabilityAdapter,
  type AvailabilityFetcher,
} from "./WarehouseAvailabilityAdapter.js";

export interface AvailabilityProviderFactory {
  create(fetcher: AvailabilityFetcher): AvailabilityProvider;
}

class WarehouseAvailabilityProviderFactory implements AvailabilityProviderFactory {
  create(fetcher: AvailabilityFetcher): AvailabilityProvider {
    return new WarehouseAvailabilityAdapter(fetcher);
  }
}

export interface PricingInfrastructure {
  repository: PriceRepository;
  availabilityProviderFactory: AvailabilityProviderFactory;
}

export function createPricingInfrastructure(): PricingInfrastructure {
  return {
    repository: new InMemoryPriceRepository(),
    availabilityProviderFactory: new WarehouseAvailabilityProviderFactory(),
  };
}
