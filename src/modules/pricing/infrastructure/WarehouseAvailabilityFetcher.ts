import type { AvailabilityProvider } from "../domain/AvailabilityProvider.js";
import type { InventoryUseCases } from "../../warehouse/application/inventory/InventoryUseCases.js";

export class WarehouseAvailabilityFetcher implements AvailabilityProvider {
  constructor(private readonly inventory: InventoryUseCases) {}

  getAvailability(sku: string) {
    return this.inventory.getAvailability({ sku });
  }
}
