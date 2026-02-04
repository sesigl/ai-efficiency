import { createPricingUseCases } from "./modules/pricing/infrastructure/di.js";
import { WarehouseAvailabilityFetcher } from "./modules/pricing/infrastructure/WarehouseAvailabilityFetcher.js";
import { createWarehouseUseCases } from "./modules/warehouse/infrastructure/di.js";

export function createAppDependencies() {
  const warehouseUseCases = createWarehouseUseCases();
  const pricingUseCases = createPricingUseCases(
    new WarehouseAvailabilityFetcher(warehouseUseCases.inventory),
  );

  return { warehouseUseCases, pricingUseCases };
}
