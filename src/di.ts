import { WarehouseAvailabilityFetcher } from "./api/warehouse-availability.fetcher.js";
import { createPricingUseCases } from "./modules/pricing/di.js";
import { createWarehouseUseCases } from "./modules/warehouse/di.js";

export function createAppDependencies() {
  const warehouseUseCases = createWarehouseUseCases();
  const pricingUseCases = createPricingUseCases(
    new WarehouseAvailabilityFetcher(warehouseUseCases.inventory),
  );

  return { warehouseUseCases, pricingUseCases };
}
