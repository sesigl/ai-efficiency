import { describe, it, expect } from "vitest";
import { createWarehouseUseCases } from "../../src/modules/warehouse/infrastructure/di.js";
import { createPricingUseCases } from "../../src/modules/pricing/infrastructure/di.js";
import type { AvailabilityProvider } from "../../src/modules/pricing/domain/AvailabilityProvider.js";
import type { InventoryUseCases } from "../../src/modules/warehouse/application/inventory/InventoryUseCases.js";
import { promotionDates } from "../fixtures/PricingFixtures.js";

describe("Pricing and Warehouse Integration", () => {
  class WarehouseAvailabilityAdapter implements AvailabilityProvider {
    constructor(private readonly inventory: InventoryUseCases) {}

    getAvailability(sku: string) {
      return this.inventory.getAvailability({ sku });
    }
  }

  function createIntegratedUseCases() {
    const warehouseUseCases = createWarehouseUseCases();
    const pricingUseCases = createPricingUseCases(
      new WarehouseAvailabilityAdapter(warehouseUseCases.inventory),
    );
    return { warehouseUseCases, pricingUseCases };
  }

  describe("cross-context price calculation", () => {
    it("applies full Black Friday discount when warehouse has high stock", () => {
      const { warehouseUseCases, pricingUseCases } = createIntegratedUseCases();
      warehouseUseCases.inventory.addStock({ sku: "TV-001", quantity: 100 });
      pricingUseCases.priceEntries.setBasePrice({ sku: "TV-001", priceInCents: 50000 });
      const { validFrom, validUntil } = promotionDates();
      pricingUseCases.promotions.addPromotion({
        sku: "TV-001",
        name: "Black Friday",
        type: "BLACK_FRIDAY",
        discountPercentage: 40,
        validFrom,
        validUntil,
        priority: 10,
      });

      const price = pricingUseCases.priceEntries.calculatePrice({ sku: "TV-001" });

      expect(price.basePrice.getCents()).toBe(50000);
      expect(price.finalPrice.getCents()).toBe(30000);
      expect(price.appliedDiscounts[0]?.reason).toBe("Full discount applied");
    });

    it("reduces Black Friday discount when warehouse stock is low", () => {
      const { warehouseUseCases, pricingUseCases } = createIntegratedUseCases();
      warehouseUseCases.inventory.addStock({ sku: "TV-001", quantity: 3 });
      pricingUseCases.priceEntries.setBasePrice({ sku: "TV-001", priceInCents: 50000 });
      const { validFrom, validUntil } = promotionDates();
      pricingUseCases.promotions.addPromotion({
        sku: "TV-001",
        name: "Black Friday",
        type: "BLACK_FRIDAY",
        discountPercentage: 40,
        validFrom,
        validUntil,
        priority: 10,
      });

      const price = pricingUseCases.priceEntries.calculatePrice({ sku: "TV-001" });

      expect(price.finalPrice.getCents()).toBe(40000);
      expect(price.appliedDiscounts[0]?.originalPercentage).toBe(40);
      expect(price.appliedDiscounts[0]?.appliedPercentage).toBe(20);
      expect(price.appliedDiscounts[0]?.reason).toBe("Reduced discount: low stock");
    });

    it("skips discount when product is out of stock", () => {
      const { pricingUseCases } = createIntegratedUseCases();
      pricingUseCases.priceEntries.setBasePrice({ sku: "TV-001", priceInCents: 50000 });
      const { validFrom, validUntil } = promotionDates();
      pricingUseCases.promotions.addPromotion({
        sku: "TV-001",
        name: "Black Friday",
        type: "BLACK_FRIDAY",
        discountPercentage: 40,
        validFrom,
        validUntil,
        priority: 10,
      });

      const price = pricingUseCases.priceEntries.calculatePrice({ sku: "TV-001" });

      expect(price.finalPrice.getCents()).toBe(50000);
      expect(price.appliedDiscounts[0]?.reason).toBe("No discount: item out of stock");
    });

    it("adjusts discount dynamically as stock changes", () => {
      const { warehouseUseCases, pricingUseCases } = createIntegratedUseCases();
      warehouseUseCases.inventory.addStock({ sku: "TV-001", quantity: 50 });
      pricingUseCases.priceEntries.setBasePrice({ sku: "TV-001", priceInCents: 50000 });
      const { validFrom, validUntil } = promotionDates();
      pricingUseCases.promotions.addPromotion({
        sku: "TV-001",
        name: "Black Friday",
        type: "BLACK_FRIDAY",
        discountPercentage: 40,
        validFrom,
        validUntil,
        priority: 10,
      });

      const priceWithHighStock = pricingUseCases.priceEntries.calculatePrice({ sku: "TV-001" });
      expect(priceWithHighStock.finalPrice.getCents()).toBe(30000);

      warehouseUseCases.inventory.removeStock({ sku: "TV-001", quantity: 48 });

      const priceWithLowStock = pricingUseCases.priceEntries.calculatePrice({ sku: "TV-001" });
      expect(priceWithLowStock.finalPrice.getCents()).toBe(40000);
    });
  });

  describe("bounded context isolation", () => {
    it("pricing only sees availability signal, not inventory internals", () => {
      const { warehouseUseCases } = createIntegratedUseCases();
      warehouseUseCases.inventory.addStock({ sku: "TV-001", quantity: 100 });

      const availability = warehouseUseCases.inventory.getAvailability({ sku: "TV-001" });

      expect(availability).toHaveProperty("sku");
      expect(availability).toHaveProperty("level");
      expect(availability).toHaveProperty("isLow");
      expect(availability).toHaveProperty("isOutOfStock");
      expect(availability).not.toHaveProperty("quantity");
      expect(availability).not.toHaveProperty("reservations");
    });
  });
});
