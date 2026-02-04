import type { AvailabilitySignal } from "../../../shared/contract/warehouse/index.js";

export interface AvailabilityProvider {
  getAvailability(sku: string): AvailabilitySignal;
}
