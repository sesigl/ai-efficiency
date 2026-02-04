import { describe, it, expect } from "vitest";
import { PriceEntry } from "../../../../src/modules/pricing/domain/PriceEntry.js";
import { SKU } from "../../../../src/modules/pricing/domain/SKU.js";
import { Money } from "../../../../src/modules/pricing/domain/Money.js";
import { Promotion } from "../../../../src/modules/pricing/domain/Promotion.js";
import { createAvailabilitySignal } from "../../../../src/shared/contract/warehouse/AvailabilitySignal.js";
import { promotionDates } from "../../../fixtures/PricingFixtures.js";

describe("PriceEntry", () => {
  const sku = SKU.create("APPLE-001");
  const basePrice = Money.fromCents(1000);

  describe("creation", () => {
    it("creates with base price", () => {
      const entry = PriceEntry.create(sku, basePrice);

      expect(entry.getBasePrice().getCents()).toBe(1000);
      expect(entry.getPromotions()).toHaveLength(0);
    });

    it("rejects zero base price", () => {
      expect(() => PriceEntry.create(sku, Money.zero())).toThrow("Base price cannot be zero");
    });
  });

  describe("promotions", () => {
    it("adds promotion to price entry", () => {
      const entry = PriceEntry.create(sku, basePrice);
      const { validFrom, validUntil } = promotionDates();
      const promotion = Promotion.create("Black Friday", "BLACK_FRIDAY", 20, validFrom, validUntil);

      entry.addPromotion(promotion);

      expect(entry.getPromotions()).toHaveLength(1);
    });

    it("rejects duplicate promotion", () => {
      const entry = PriceEntry.create(sku, basePrice);
      const { validFrom, validUntil } = promotionDates();
      const promotion = Promotion.create("Black Friday", "BLACK_FRIDAY", 20, validFrom, validUntil);
      entry.addPromotion(promotion);

      expect(() => entry.addPromotion(promotion)).toThrow("Promotion already exists");
    });

    it("removes promotion by name", () => {
      const entry = PriceEntry.create(sku, basePrice);
      const { validFrom, validUntil } = promotionDates();
      entry.addPromotion(
        Promotion.create("Black Friday", "BLACK_FRIDAY", 20, validFrom, validUntil),
      );

      entry.removePromotion("Black Friday");

      expect(entry.getPromotions()).toHaveLength(0);
    });
  });

  describe("price calculation", () => {
    it("returns base price when no promotions exist", () => {
      const entry = PriceEntry.create(sku, basePrice);
      const availability = createAvailabilitySignal("APPLE-001", "HIGH");

      const calculated = entry.calculatePrice(availability);

      expect(calculated.finalPrice.getCents()).toBe(1000);
      expect(calculated.appliedDiscounts).toHaveLength(0);
    });

    it("applies full discount when stock is high", () => {
      const entry = PriceEntry.create(sku, basePrice);
      const { validFrom, validUntil } = promotionDates();
      entry.addPromotion(
        Promotion.create("Black Friday", "BLACK_FRIDAY", 20, validFrom, validUntil),
      );
      const availability = createAvailabilitySignal("APPLE-001", "HIGH");

      const calculated = entry.calculatePrice(availability);

      expect(calculated.finalPrice.getCents()).toBe(800);
      expect(calculated.appliedDiscounts[0]?.appliedPercentage).toBe(20);
    });

    it("reduces discount by 50% when stock is low", () => {
      const entry = PriceEntry.create(sku, basePrice);
      const { validFrom, validUntil } = promotionDates();
      entry.addPromotion(
        Promotion.create("Black Friday", "BLACK_FRIDAY", 20, validFrom, validUntil),
      );
      const availability = createAvailabilitySignal("APPLE-001", "LOW");

      const calculated = entry.calculatePrice(availability);

      expect(calculated.finalPrice.getCents()).toBe(900);
      expect(calculated.appliedDiscounts[0]?.appliedPercentage).toBe(10);
      expect(calculated.appliedDiscounts[0]?.reason).toBe("Reduced discount: low stock");
    });

    it("applies no discount when out of stock", () => {
      const entry = PriceEntry.create(sku, basePrice);
      const { validFrom, validUntil } = promotionDates();
      entry.addPromotion(
        Promotion.create("Black Friday", "BLACK_FRIDAY", 20, validFrom, validUntil),
      );
      const availability = createAvailabilitySignal("APPLE-001", "OUT_OF_STOCK");

      const calculated = entry.calculatePrice(availability);

      expect(calculated.finalPrice.getCents()).toBe(1000);
      expect(calculated.appliedDiscounts[0]?.appliedPercentage).toBe(0);
      expect(calculated.appliedDiscounts[0]?.reason).toBe("No discount: item out of stock");
    });

    it("ignores inactive promotions", () => {
      const entry = PriceEntry.create(sku, basePrice);
      const pastStart = new Date();
      pastStart.setDate(pastStart.getDate() - 30);
      const pastEnd = new Date();
      pastEnd.setDate(pastEnd.getDate() - 1);
      entry.addPromotion(Promotion.create("Old Sale", "SEASONAL", 15, pastStart, pastEnd));
      const availability = createAvailabilitySignal("APPLE-001", "HIGH");

      const calculated = entry.calculatePrice(availability);

      expect(calculated.finalPrice.getCents()).toBe(1000);
      expect(calculated.appliedDiscounts).toHaveLength(0);
    });
  });
});
