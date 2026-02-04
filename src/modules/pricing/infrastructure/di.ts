import { PriceRepository, AvailabilityProvider } from '../domain/index.js';
import {
  SetBasePrice,
  AddPromotion,
  RemovePromotion,
  CalculatePrice,
  GetPriceEntry,
} from '../application/index.js';
import { InMemoryPriceRepository } from './InMemoryPriceRepository.js';
import { WarehouseAvailabilityAdapter } from './WarehouseAvailabilityAdapter.js';
import { GetAvailability } from '../../warehouse/application/index.js';

export class PricingContainer {
  constructor(
    public readonly repository: PriceRepository,
    public readonly setBasePrice: SetBasePrice,
    public readonly addPromotion: AddPromotion,
    public readonly removePromotion: RemovePromotion,
    public readonly calculatePrice: CalculatePrice,
    public readonly getPriceEntry: GetPriceEntry
  ) {}
}

export function createPricingContainer(
  warehouseGetAvailability: GetAvailability,
  repository: PriceRepository = new InMemoryPriceRepository()
): PricingContainer {
  const availabilityProvider: AvailabilityProvider = new WarehouseAvailabilityAdapter(warehouseGetAvailability);

  return new PricingContainer(
    repository,
    new SetBasePrice(repository),
    new AddPromotion(repository),
    new RemovePromotion(repository),
    new CalculatePrice(repository, availabilityProvider),
    new GetPriceEntry(repository)
  );
}
