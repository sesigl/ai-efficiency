import type { AvailabilityFetcher } from "../modules/pricing/infrastructure/WarehouseAvailabilityAdapter.js";
import type { InventoryUseCases } from "../modules/warehouse/application/inventory/InventoryUseCases.js";

export class WarehouseAvailabilityFetcher implements AvailabilityFetcher {
  constructor(private readonly inventory: InventoryUseCases) {}

  fetchAvailability(sku: string) {
    return this.inventory.getAvailability({ sku });
  }
}
