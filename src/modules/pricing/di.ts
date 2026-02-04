import type { PriceRepository, AvailabilityProvider } from "./domain/index.js";
import {
  SetBasePrice,
  AddPromotion,
  RemovePromotion,
  CalculatePrice,
  GetPriceEntry,
} from "./application/index.js";
import { createPricingInfrastructure } from "./infrastructure/di.js";
import type { AvailabilityFetcher } from "./infrastructure/WarehouseAvailabilityAdapter.js";

export interface PricingContainer {
  repository: PriceRepository;
  setBasePrice: SetBasePrice;
  addPromotion: AddPromotion;
  removePromotion: RemovePromotion;
  calculatePrice: CalculatePrice;
  getPriceEntry: GetPriceEntry;
}

export function createPricingContainer(
  availabilityFetcher: AvailabilityFetcher,
  repository?: PriceRepository,
): PricingContainer {
  const infra = createPricingInfrastructure();
  const repo = repository ?? infra.repository;
  const availabilityProvider: AvailabilityProvider =
    infra.createAvailabilityProvider(availabilityFetcher);

  return {
    repository: repo,
    setBasePrice: new SetBasePrice(repo),
    addPromotion: new AddPromotion(repo),
    removePromotion: new RemovePromotion(repo),
    calculatePrice: new CalculatePrice(repo, availabilityProvider),
    getPriceEntry: new GetPriceEntry(repo),
  };
}
