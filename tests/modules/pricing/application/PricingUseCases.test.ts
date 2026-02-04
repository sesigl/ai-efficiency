import { describe, it, expect } from "vitest";
import {
  createTestPricingUseCasesWithFakeAvailability,
  createBlackFridayPromotion,
} from "../../../fixtures/PricingFixtures.js";

describe("Pricing Use Cases", () => {
  const createUseCases = () => createTestPricingUseCasesWithFakeAvailability();

  describe("SetBasePrice", () => {
    it("creates price entry for new SKU", () => {
      const { useCases } = createUseCases();

      useCases.priceEntries.setBasePrice({ sku: "APPLE-001", priceInCents: 999 });

      const entry = useCases.priceEntries.getPriceEntry({ sku: "APPLE-001" });
      expect(entry?.basePriceInCents).toBe(999);
    });

    it("updates base price for existing SKU", () => {
      const { useCases } = createUseCases();
      useCases.priceEntries.setBasePrice({ sku: "APPLE-001", priceInCents: 999 });

      useCases.priceEntries.setBasePrice({ sku: "APPLE-001", priceInCents: 1299 });

      const entry = useCases.priceEntries.getPriceEntry({ sku: "APPLE-001" });
      expect(entry?.basePriceInCents).toBe(1299);
    });
  });

  describe("AddPromotion", () => {
    it("adds promotion to existing price entry", () => {
      const { useCases } = createUseCases();
      useCases.priceEntries.setBasePrice({ sku: "APPLE-001", priceInCents: 999 });
      const promo = createBlackFridayPromotion();

      useCases.promotions.addPromotion({ sku: "APPLE-001", ...promo });

      const entry = useCases.priceEntries.getPriceEntry({ sku: "APPLE-001" });
      expect(entry?.promotions).toHaveLength(1);
      expect(entry?.promotions[0]?.name).toBe("Black Friday");
    });

    it("rejects promotion for non-existent SKU", () => {
      const { useCases } = createUseCases();
      const promo = createBlackFridayPromotion();

      expect(() => useCases.promotions.addPromotion({ sku: "UNKNOWN", ...promo })).toThrow(
        "Price entry not found",
      );
    });
  });

  describe("RemovePromotion", () => {
    it("removes promotion from price entry", () => {
      const { useCases } = createUseCases();
      useCases.priceEntries.setBasePrice({ sku: "APPLE-001", priceInCents: 999 });
      useCases.promotions.addPromotion({ sku: "APPLE-001", ...createBlackFridayPromotion() });

      useCases.promotions.removePromotion({ sku: "APPLE-001", promotionName: "Black Friday" });

      const entry = useCases.priceEntries.getPriceEntry({ sku: "APPLE-001" });
      expect(entry?.promotions).toHaveLength(0);
    });
  });

  describe("CalculatePrice", () => {
    it("returns base price when no promotions", () => {
      const { useCases, fakeAvailability } = createUseCases();
      useCases.priceEntries.setBasePrice({ sku: "APPLE-001", priceInCents: 1000 });
      fakeAvailability.setAvailability("APPLE-001", "HIGH");

      const result = useCases.priceEntries.calculatePrice({ sku: "APPLE-001" });

      expect(result.finalPrice.getCents()).toBe(1000);
    });

    it("applies full discount with high availability", () => {
      const { useCases, fakeAvailability } = createUseCases();
      useCases.priceEntries.setBasePrice({ sku: "APPLE-001", priceInCents: 1000 });
      useCases.promotions.addPromotion({ sku: "APPLE-001", ...createBlackFridayPromotion(30) });
      fakeAvailability.setAvailability("APPLE-001", "HIGH");

      const result = useCases.priceEntries.calculatePrice({ sku: "APPLE-001" });

      expect(result.finalPrice.getCents()).toBe(700);
    });

    it("reduces discount with low availability", () => {
      const { useCases, fakeAvailability } = createUseCases();
      useCases.priceEntries.setBasePrice({ sku: "APPLE-001", priceInCents: 1000 });
      useCases.promotions.addPromotion({ sku: "APPLE-001", ...createBlackFridayPromotion(30) });
      fakeAvailability.setAvailability("APPLE-001", "LOW");

      const result = useCases.priceEntries.calculatePrice({ sku: "APPLE-001" });

      expect(result.finalPrice.getCents()).toBe(850);
      expect(result.appliedDiscounts[0]?.originalPercentage).toBe(30);
      expect(result.appliedDiscounts[0]?.appliedPercentage).toBe(15);
    });

    it("applies no discount when out of stock", () => {
      const { useCases, fakeAvailability } = createUseCases();
      useCases.priceEntries.setBasePrice({ sku: "APPLE-001", priceInCents: 1000 });
      useCases.promotions.addPromotion({ sku: "APPLE-001", ...createBlackFridayPromotion(30) });
      fakeAvailability.setAvailability("APPLE-001", "OUT_OF_STOCK");

      const result = useCases.priceEntries.calculatePrice({ sku: "APPLE-001" });

      expect(result.finalPrice.getCents()).toBe(1000);
      expect(result.appliedDiscounts[0]?.appliedPercentage).toBe(0);
    });
  });
});
