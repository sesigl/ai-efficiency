import { createCatalogUseCases } from "./modules/catalog/infrastructure/di.js";
import { createPricingUseCases } from "./modules/pricing/infrastructure/di.js";
import type { AvailabilityProvider } from "./modules/pricing/domain/price-entry/AvailabilityProvider.js";
import { createWarehouseUseCases } from "./modules/warehouse/infrastructure/di.js";
import type { InventoryUseCases } from "./modules/warehouse/application/inventory/InventoryUseCases.js";
import type { PriceEntryUseCases } from "./modules/pricing/application/price-entry/PriceEntryUseCases.js";
import {
  ShelfLabelUseCases,
  type ShelfLabelPriceProvider,
  type ShelfLabelPriceInfo,
  type ShelfLabelAvailabilityProvider,
  type ShelfLabelAvailabilityInfo,
  type AvailabilityBadge,
} from "./application/shelf-label/ShelfLabelUseCases.js";

class WarehouseAvailabilityAdapter implements AvailabilityProvider {
  constructor(private readonly inventory: InventoryUseCases) {}

  getAvailability(sku: string) {
    return this.inventory.getAvailability({ sku });
  }
}

class PricingShelfLabelAdapter implements ShelfLabelPriceProvider {
  constructor(private readonly priceEntries: PriceEntryUseCases) {}

  getShelfLabelPriceInfo(sku: string): ShelfLabelPriceInfo | undefined {
    try {
      const calculated = this.priceEntries.calculateSavingsSummary({ sku });

      return {
        basePriceInCents: calculated.basePriceInCents,
        finalPriceInCents: calculated.finalPriceInCents,
        savingsPercentage: calculated.totalSavingsPercentage,
        hasActiveDiscount: calculated.totalSavingsInCents > 0,
      };
    } catch {
      return undefined;
    }
  }
}

class WarehouseShelfLabelAdapter implements ShelfLabelAvailabilityProvider {
  constructor(private readonly inventory: InventoryUseCases) {}

  getShelfLabelAvailabilityInfo(sku: string): ShelfLabelAvailabilityInfo {
    const signal = this.inventory.getAvailability({ sku });

    const badgeMap: Record<string, AvailabilityBadge> = {
      HIGH: "In Stock",
      MEDIUM: "In Stock",
      LOW: "Low Stock",
      OUT_OF_STOCK: "Out of Stock",
    };

    return { badge: badgeMap[signal.level] ?? "Out of Stock" };
  }
}

export function createAppDependencies() {
  const warehouseUseCases = createWarehouseUseCases();
  const pricingUseCases = createPricingUseCases(
    new WarehouseAvailabilityAdapter(warehouseUseCases.inventory),
  );

  const shelfLabel = new ShelfLabelUseCases(
    new PricingShelfLabelAdapter(pricingUseCases.priceEntries),
    new WarehouseShelfLabelAdapter(warehouseUseCases.inventory),
  );

  const catalogUseCases = createCatalogUseCases();

  return { warehouseUseCases, pricingUseCases, shelfLabel, catalogUseCases };
}
