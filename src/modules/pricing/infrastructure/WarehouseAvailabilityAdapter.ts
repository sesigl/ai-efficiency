import type { AvailabilityProvider } from "../domain/AvailabilityProvider.js";
import type { AvailabilitySignal } from "../../../shared/contract/warehouse/AvailabilitySignal.js";

export interface AvailabilityFetcher {
  fetchAvailability(sku: string): AvailabilitySignal;
}

export class WarehouseAvailabilityAdapter implements AvailabilityProvider {
  constructor(private readonly fetcher: AvailabilityFetcher) {}

  getAvailability(sku: string): AvailabilitySignal {
    return this.fetcher.fetchAvailability(sku);
  }
}
