import { createPricingUseCases } from "./modules/pricing/infrastructure/di.js";
import type { AvailabilityProvider } from "./modules/pricing/domain/price-entry/AvailabilityProvider.js";
import { createWarehouseUseCases } from "./modules/warehouse/infrastructure/di.js";
import type { InventoryUseCases } from "./modules/warehouse/application/inventory/InventoryUseCases.js";

class WarehouseAvailabilityAdapter implements AvailabilityProvider {
  constructor(private readonly inventory: InventoryUseCases) {}

  getAvailability(sku: string) {
    return this.inventory.getAvailability({ sku });
  }
}

export function createAppDependencies() {
  const warehouseUseCases = createWarehouseUseCases();
  const pricingUseCases = createPricingUseCases(
    new WarehouseAvailabilityAdapter(warehouseUseCases.inventory),
  );

  return { warehouseUseCases, pricingUseCases };
}
