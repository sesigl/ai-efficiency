import type { AvailabilityProvider } from "../domain/AvailabilityProvider.js";
import type { AvailabilitySignal } from "../../../shared/contract/warehouse/AvailabilitySignal.js";

export type AvailabilityFetcher = (sku: string) => AvailabilitySignal;

export class WarehouseAvailabilityAdapter implements AvailabilityProvider {
  constructor(private readonly fetchAvailability: AvailabilityFetcher) {}

  getAvailability(sku: string): AvailabilitySignal {
    return this.fetchAvailability(sku);
  }
}
