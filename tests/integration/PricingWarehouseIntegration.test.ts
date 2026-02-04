import { describe, it, expect } from "vitest";
import { createWarehouseContainer } from "../../src/modules/warehouse/index.js";
import { createPricingContainer } from "../../src/modules/pricing/index.js";
import { promotionDates } from "../fixtures/PricingFixtures.js";

describe("Pricing and Warehouse Integration", () => {
  function createIntegratedContainers() {
    const warehouseContainer = createWarehouseContainer();
    const pricingContainer = createPricingContainer((sku: string) =>
      warehouseContainer.getAvailability.execute({ sku }),
    );
    return { warehouseContainer, pricingContainer };
  }

  describe("cross-context price calculation", () => {
    it("applies full Black Friday discount when warehouse has high stock", () => {
      const { warehouseContainer, pricingContainer } = createIntegratedContainers();
      warehouseContainer.addStock.execute({ sku: "TV-001", quantity: 100 });
      pricingContainer.setBasePrice.execute({ sku: "TV-001", priceInCents: 50000 });
      const { validFrom, validUntil } = promotionDates();
      pricingContainer.addPromotion.execute({
        sku: "TV-001",
        name: "Black Friday",
        type: "BLACK_FRIDAY",
        discountPercentage: 40,
        validFrom,
        validUntil,
        priority: 10,
      });

      const price = pricingContainer.calculatePrice.execute({ sku: "TV-001" });

      expect(price.basePrice.getCents()).toBe(50000);
      expect(price.finalPrice.getCents()).toBe(30000);
      expect(price.appliedDiscounts[0]?.reason).toBe("Full discount applied");
    });

    it("reduces Black Friday discount when warehouse stock is low", () => {
      const { warehouseContainer, pricingContainer } = createIntegratedContainers();
      warehouseContainer.addStock.execute({ sku: "TV-001", quantity: 3 });
      pricingContainer.setBasePrice.execute({ sku: "TV-001", priceInCents: 50000 });
      const { validFrom, validUntil } = promotionDates();
      pricingContainer.addPromotion.execute({
        sku: "TV-001",
        name: "Black Friday",
        type: "BLACK_FRIDAY",
        discountPercentage: 40,
        validFrom,
        validUntil,
        priority: 10,
      });

      const price = pricingContainer.calculatePrice.execute({ sku: "TV-001" });

      expect(price.finalPrice.getCents()).toBe(40000);
      expect(price.appliedDiscounts[0]?.originalPercentage).toBe(40);
      expect(price.appliedDiscounts[0]?.appliedPercentage).toBe(20);
      expect(price.appliedDiscounts[0]?.reason).toBe("Reduced discount: low stock");
    });

    it("skips discount when product is out of stock", () => {
      const { pricingContainer } = createIntegratedContainers();
      pricingContainer.setBasePrice.execute({ sku: "TV-001", priceInCents: 50000 });
      const { validFrom, validUntil } = promotionDates();
      pricingContainer.addPromotion.execute({
        sku: "TV-001",
        name: "Black Friday",
        type: "BLACK_FRIDAY",
        discountPercentage: 40,
        validFrom,
        validUntil,
        priority: 10,
      });

      const price = pricingContainer.calculatePrice.execute({ sku: "TV-001" });

      expect(price.finalPrice.getCents()).toBe(50000);
      expect(price.appliedDiscounts[0]?.reason).toBe("No discount: item out of stock");
    });

    it("adjusts discount dynamically as stock changes", () => {
      const { warehouseContainer, pricingContainer } = createIntegratedContainers();
      warehouseContainer.addStock.execute({ sku: "TV-001", quantity: 50 });
      pricingContainer.setBasePrice.execute({ sku: "TV-001", priceInCents: 50000 });
      const { validFrom, validUntil } = promotionDates();
      pricingContainer.addPromotion.execute({
        sku: "TV-001",
        name: "Black Friday",
        type: "BLACK_FRIDAY",
        discountPercentage: 40,
        validFrom,
        validUntil,
        priority: 10,
      });

      const priceWithHighStock = pricingContainer.calculatePrice.execute({ sku: "TV-001" });
      expect(priceWithHighStock.finalPrice.getCents()).toBe(30000);

      warehouseContainer.removeStock.execute({ sku: "TV-001", quantity: 48 });

      const priceWithLowStock = pricingContainer.calculatePrice.execute({ sku: "TV-001" });
      expect(priceWithLowStock.finalPrice.getCents()).toBe(40000);
    });
  });

  describe("bounded context isolation", () => {
    it("pricing only sees availability signal, not inventory internals", () => {
      const { warehouseContainer } = createIntegratedContainers();
      warehouseContainer.addStock.execute({ sku: "TV-001", quantity: 100 });

      const availability = warehouseContainer.getAvailability.execute({ sku: "TV-001" });

      expect(availability).toHaveProperty("sku");
      expect(availability).toHaveProperty("level");
      expect(availability).toHaveProperty("isLow");
      expect(availability).toHaveProperty("isOutOfStock");
      expect(availability).not.toHaveProperty("quantity");
      expect(availability).not.toHaveProperty("reservations");
    });
  });
});
