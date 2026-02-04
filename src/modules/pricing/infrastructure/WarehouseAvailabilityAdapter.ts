import type { AvailabilityProvider } from "../domain/index.js";
import type { AvailabilitySignal } from "../../../shared/contract/warehouse/index.js";

export type AvailabilityFetcher = (sku: string) => AvailabilitySignal;

export class WarehouseAvailabilityAdapter implements AvailabilityProvider {
  constructor(private readonly fetchAvailability: AvailabilityFetcher) {}

  getAvailability(sku: string): AvailabilitySignal {
    return this.fetchAvailability(sku);
  }
}
