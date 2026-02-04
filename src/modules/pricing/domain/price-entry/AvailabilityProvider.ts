import type { AvailabilitySignal } from "../../../../shared/contract/warehouse/AvailabilitySignal.js";

export interface AvailabilityProvider {
  getAvailability(sku: string): AvailabilitySignal;
}
