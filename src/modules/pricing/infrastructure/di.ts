import type { PriceRepository } from "../domain/PriceRepository.js";
import { InMemoryPriceRepository } from "./InMemoryPriceRepository.js";

export interface PricingInfrastructure {
  repository: PriceRepository;
}

export function createPricingInfrastructure(): PricingInfrastructure {
  return {
    repository: new InMemoryPriceRepository(),
  };
}
